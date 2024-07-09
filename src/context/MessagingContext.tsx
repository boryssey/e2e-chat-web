import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useDbContext } from './DbContext'
import { useAuthContext } from './AuthContext'
import {
  DisconnectDescription,
  ServerToClientEvents,
  socket,
} from '@/utils/socket'
import {
  MessageType,
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from '@privacyresearch/libsignal-protocol-typescript'

import { arrayBufferToString } from '@/utils/EncryptedSignalStore'
import { stringToArrayBuffer } from '@/utils/helpers'
import { Contact } from '@/utils/db'
import { useModal } from '@/components/Modal'
import { SessionRecord } from '@privacyresearch/libsignal-protocol-typescript/lib/session-record'

interface SerializedBuffer {
  data: number[]
  type: 'Buffer'
}

interface KeyBundleResponse {
  key_bundles: {
    id: number
    created_at: Date | null
    user_id: number
    identity_pub_key: SerializedBuffer
    signed_pre_key_id: number
    signed_pre_key_signature: SerializedBuffer
    signed_pre_key_pub_key: SerializedBuffer
    registration_id: number
  }
  one_time_keys?: {
    id: number
    key_bundle_id: number
    key_id: number
    pub_key: SerializedBuffer
  }
}

export const getRemoteKeyBundle = async (username: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${username}/keyBundle`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )

  const data = (await response.json()) as KeyBundleResponse

  if (!response.ok) {
    console.error(response.status, response.statusText)
    throw new Error('Failed to fetch remote key bundle')
  }

  const transformedBundle = {
    registrationId: data.key_bundles.registration_id,
    ...(data.one_time_keys && {
      preKey: {
        keyId: data.one_time_keys.key_id,
        publicKey: Uint8Array.from(data.one_time_keys.pub_key.data)
          .buffer as ArrayBuffer,
      },
    }),
    signedPreKey: {
      keyId: data.key_bundles.signed_pre_key_id,
      publicKey: Uint8Array.from(data.key_bundles.signed_pre_key_pub_key.data)
        .buffer as ArrayBuffer,
      signature: Uint8Array.from(data.key_bundles.signed_pre_key_signature.data)
        .buffer as ArrayBuffer,
    },
    identityKey: Uint8Array.from(data.key_bundles.identity_pub_key.data)
      .buffer as ArrayBuffer,
  }
  return transformedBundle
}

interface IMessagingContext {
  socketState: SocketStateType
  sendMessage: (
    messageText: string,
    recipientUsername: string,
    callback?: () => void
  ) => Promise<void>
}

const MessagingContext = createContext<IMessagingContext | null>(null)

export const useMessagingContext = () => {
  const messagingContext = useContext(MessagingContext)
  if (!messagingContext) {
    throw new Error(
      'useMessagingContext must be used within a MessagingProvider'
    )
  }
  return messagingContext
}

export type SocketStateType = 'connected' | 'lost_connection' | 'disconnected'

const MessagingContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { appDB, signalStore } = useDbContext()
  const { user } = useAuthContext()
  const [socketState, setSocketState] =
    useState<SocketStateType>('disconnected')
  const { showModal, hideModal } = useModal()
  const handleConnect = () => {
    setSocketState('connected')
  }
  const handleDisconnect = (
    reason: string,
    details: DisconnectDescription | undefined
  ) => {
    console.log('Socket disconnected', reason, details)
    if (socket.active) {
      setSocketState('lost_connection')
    } else {
      setSocketState('disconnected')
    }
  }

  const verifyRemoteUserIdentityKey = useCallback(
    async (recipientUsername: string) => {
      const identityPubKey =
        await signalStore.getRemoteIdentityKeyByUsername(recipientUsername)
      if (!identityPubKey) {
        console.error('No identity key found for recipient')
        return
      }
      const isValidRemoteIdentityKey = await socket.emitWithAck(
        'keyBundle:verify',
        {
          identityPubKey,
          username: recipientUsername,
        }
      )
      return isValidRemoteIdentityKey.verified
    },
    [signalStore]
  )

  const buildNewSessionWithRecipient = useCallback(
    async (recipientAddress: SignalProtocolAddress) => {
      const sessionBuilder = new SessionBuilder(signalStore, recipientAddress)
      const recipientBundle = await getRemoteKeyBundle(
        recipientAddress.getName()
      )
      await sessionBuilder.processPreKey(recipientBundle)
    },
    [signalStore]
  )

  const encryptAndSendMessage = useCallback(
    async ({
      sessionCipher,
      messageText,
      recipientUsername,
      contact,
    }: {
      sessionCipher: SessionCipher
      messageText: string
      recipientUsername: string
      contact: Contact
    }) => {
      const encryptedMessage = await sessionCipher.encrypt(
        stringToArrayBuffer(messageText).buffer
      )

      const messageToSend = {
        to: recipientUsername,
        message: encryptedMessage,
        timestamp: Date.now(),
      }
      await socket.emitWithAck('message:send', messageToSend)

      await appDB.messages.add({
        contactId: contact.id!,
        message: messageText,
        timestamp: messageToSend.timestamp,
        isFromMe: true,
      })
    },
    [appDB.messages]
  )

  const sendMessage = useCallback(
    async (
      messageText: string,
      recipientUsername: string,
      callback?: () => void
    ) => {
      const recipientAddress = new SignalProtocolAddress(recipientUsername, 1)
      try {
        let contact = await appDB.getContactByName(recipientUsername)
        if (!contact) {
          const contactId = await appDB.addContact(recipientUsername)
          contact = { id: contactId, name: recipientUsername }
        }
        const sessionCipher = new SessionCipher(signalStore, recipientAddress)
        const hasOpenSession = await sessionCipher.hasOpenSession()

        if (!hasOpenSession) {
          await buildNewSessionWithRecipient(recipientAddress)
        } else {
          const isValidRemoteIdentityKey =
            await verifyRemoteUserIdentityKey(recipientUsername)
          if (!isValidRemoteIdentityKey) {
            console.error('Remote identity key verification failed')

            showModal({
              title: 'User generated new identity',
              content: `User that you are trying to message has generated a new identity recently. That could mean they recently logged on a new device without transfering their old data.
              Do you still want to send this message?`,
              cancelButtonText: 'Cancel',
              onCancel: hideModal,
              onConfirm: async () => {
                await sessionCipher.deleteAllSessionsForDevice()
                await signalStore.deleteIdentity(recipientUsername)
                await buildNewSessionWithRecipient(recipientAddress)
                await encryptAndSendMessage({
                  sessionCipher,
                  messageText,
                  recipientUsername,
                  contact,
                })
                callback?.()
              },
              confirmButtonText: 'Send',
            })
            return
          }
        }
        await encryptAndSendMessage({
          sessionCipher,
          messageText,
          recipientUsername,
          contact,
        })
        callback?.()
      } catch (error) {
        console.error(error)
        throw new Error('Failed to send message')
      }
    },
    [
      appDB,
      buildNewSessionWithRecipient,
      encryptAndSendMessage,
      hideModal,
      showModal,
      signalStore,
      verifyRemoteUserIdentityKey,
    ]
  )

  const onMessageReceive: ServerToClientEvents['message:receive'] = useCallback(
    async (messageData) => {
      try {
        const senderName = messageData.from_user_username
        const sender = new SignalProtocolAddress(senderName, 1)
        const sessionCipher = new SessionCipher(signalStore, sender)
        const message = messageData.message
        const contact = await appDB.getOrCreateContact(senderName)
        const sessionWithRecipient = await signalStore.loadSession(
          sender.toString()
        )
        let decryptedMessage: string | undefined
        if (message.type === 3) {
          if (!message.body) {
            console.warn('Received message of not supported type')
            return
          }
          decryptedMessage = arrayBufferToString(
            await sessionCipher.decryptPreKeyWhisperMessage(
              message.body,
              'binary'
            )
          )
        } else if (message.type === 1) {
          if (!message.body) {
            console.warn('Received message of not supported type')
            return
          }
          decryptedMessage = arrayBufferToString(
            await sessionCipher.decryptWhisperMessage(message.body, 'binary')
          )
        }
        if (!decryptedMessage) {
          console.warn('Received message of not supported type')
          return
        }

        const decryptedMessageToSave = {
          contactId: contact.id!,
          timestamp: new Date(messageData.timestamp).getTime(),
          message: decryptedMessage,
        }
        await appDB.messages.add(decryptedMessageToSave)
        await socket.emitWithAck('message:ack', {
          lastReceivedMessageId: messageData.id,
        })
      } catch (error) {
        if (
          error instanceof Error &&
          error.message !== 'Identity key changed' &&
          error.message !== 'Bad MAC'
        ) {
          console.error(error)
          throw new Error('Failed to receive message')
        }
        console.error(error)

        const cipher = new SessionCipher(
          signalStore,
          new SignalProtocolAddress(messageData.from_user_username, 1)
        )
        const hasOpenSession = await cipher.hasOpenSession()
        if (hasOpenSession) {
          const isValidRemoteIdentityKey = await verifyRemoteUserIdentityKey(
            messageData.from_user_username
          )
          if (!isValidRemoteIdentityKey) {
            console.error('Remote identity key verification failed')
            await cipher.deleteAllSessionsForDevice()
            await signalStore.deleteIdentity(messageData.from_user_username)
            try {
              await onMessageReceive(messageData)
            } catch (error2) {
              console.error(error2)
              throw new Error('Failed to receive message')
            }
          }
        }
      }
    },
    [appDB, signalStore, verifyRemoteUserIdentityKey]
  )

  const onMessageStored: ServerToClientEvents['messages:stored'] = useCallback(
    async (data) => {
      const promises = Object.entries(data).map(
        async ([_senderUsername, messages]) => {
          const messagesPromise = messages.map(async (message) =>
            onMessageReceive({
              id: message.message.id,
              from_user_username: message.from_user_username,
              from_user_id: message.from_user_user_id,
              to_user_id: message.message.to_user_id,
              message: message.message.message as MessageType,
              timestamp: message.message.timestamp,
            })
          )
          return Promise.all(messagesPromise)
        }
      )
      await Promise.all(promises)
    },
    [onMessageReceive]
  )

  useEffect(() => {
    socket.on('message:receive', onMessageReceive)

    return () => {
      socket.off('message:receive', onMessageReceive)
    }
  }, [onMessageReceive])

  useEffect(() => {
    socket.on('messages:stored', onMessageStored)
    return () => {
      socket.off('messages:stored', onMessageStored)
    }
  }, [onMessageStored])

  useEffect(() => {
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [appDB, user])

  const state = {
    socketState,
    sendMessage,
  }

  return (
    <MessagingContext.Provider value={state}>
      {children}
    </MessagingContext.Provider>
  )
}

export default MessagingContextProvider
