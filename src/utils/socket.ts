'use client'

import {
  MessageType,
  PreKeyType,
  SignedPublicPreKeyType,
} from '@privacyresearch/libsignal-protocol-typescript'
import { Socket, io } from 'socket.io-client'

export interface ServerToClientEvents {
  'messages:stored': (
    data: Record<
      string,
      {
        from_user_user_id: number
        from_user_username: string
        message: {
          id: number
          from_user_id: number
          to_user_id: number
          message: unknown
          timestamp: number
        }
      }[]
    >
  ) => void | Promise<void>

  'message:receive': (data: {
    id: number
    message: MessageType
    from_user_id: number
    from_user_username: string
    to_user_id: number
    timestamp: number
  }) => void | Promise<void>

  hello: (data: { hello: 'world' }) => void | Promise<void>
}

type Result<Error, Value> =
  | {
      success: false
      error: Error
    }
  | {
      success: true
      value?: Value
    }

export type CallbackWithError<Value> = (data: Result<Error, Value>) => void

export interface ClientToServerEvents {
  'message:send': (
    data: {
      to: string
      message: MessageType
      timestamp: number
      // }, callback: () => void | Promise<void>) => void | Promise<void>;
    },
    callback: CallbackWithError<Record<string, unknown>>
  ) => void
  'message:ack': (
    data: {
      lastReceivedMessageId: number
    },
    callback: CallbackWithError<Record<string, unknown>>
  ) => void
  'keyBundle:save': (
    data: {
      registrationId: number
      identityPubKey: ArrayBuffer
      signedPreKey: SignedPublicPreKeyType
      oneTimePreKeys: PreKeyType[]
    },
    callback: CallbackWithError<Record<string, unknown>>
  ) => void
  'keyBundle:verify': (
    data: {
      identityPubKey: ArrayBuffer
      username: string
    },
    callback: CallbackWithError<{ verified?: boolean }>
  ) => void
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.NEXT_PUBLIC_BACKEND_URL,
  {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
    ackTimeout: 10000,
    retries: 3,
  }
)

export declare type DisconnectDescription =
  | Error
  | {
      description: string
      context?: unknown
    }

export declare type AllButLast<T extends unknown[]> = T extends [
  ...infer H,
  infer _L,
]
  ? H
  : unknown[]

export const emitEventWithAck = async (
  ...[eventName, ...data]: Parameters<typeof socket.emitWithAck>
) => {
  const response = await socket.emitWithAck(eventName, ...data)

  if (response.success) {
    return response.value
  }
  throw new Error(response.error.name)
}
