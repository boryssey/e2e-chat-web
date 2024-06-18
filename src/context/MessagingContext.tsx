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
  console.log(transformedBundle, 'transformedBundle')
  return transformedBundle
}

interface IMessagingContext {
  socketState: SocketStateType
  sendMessage: (messageText: string, recipientUsername: string) => Promise<void>
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

type SocketStateType = 'connected' | 'lost_connection' | 'disconnected'

const MessagingContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { appDB, signalStore } = useDbContext()
  const { user } = useAuthContext()
  const [socketState, setSocketState] =
    useState<SocketStateType>('disconnected')

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

  const sendMessage = useCallback(
    async (messageText: string, recipientUsername: string) => {
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
          const sessionBuilder = new SessionBuilder(
            signalStore,
            recipientAddress
          )
          const recipientBundle = await getRemoteKeyBundle(recipientUsername)
          await sessionBuilder.processPreKey(recipientBundle)
        }
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
      } catch (error) {
        console.error(error)
      }
    },
    [appDB, signalStore]
  )

  const onMessageReceive: ServerToClientEvents['message:receive'] = useCallback(
    async (messageData) => {
      const senderName = messageData.from_user_username
      const sender = new SignalProtocolAddress(senderName, 1)
      const sessionCipher = new SessionCipher(signalStore, sender)
      const message = messageData.message
      const contact = await appDB.getOrCreateContact(senderName)
      console.log('🚀 ~ socket.on ~ message:', message)
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

      console.log(
        `decryptedMessage, type: ${message.type}, Message: ${decryptedMessage}`
      )
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
    },
    [appDB, signalStore]
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
