"use client";

import {
  MessageType,
  PreKeyType,
  SignedPublicPreKeyType,
} from "@privacyresearch/libsignal-protocol-typescript";
import { Socket, io } from "socket.io-client";

export interface ServerToClientEvents {
  "messages:stored": (
    data: Record<
      string,
      {
        from_user_user_id: number;
        from_user_username: string;
        message: {
          id: number;
          from_user_id: number;
          to_user_id: number;
          message: unknown;
          timestamp: number;
        };
      }[]
    >
  ) => void | Promise<void>;

  "message:receive": (data: {
    id: number;
    message: MessageType;
    from_user_id: number;
    from_user_username: string;
    to_user_id: number;
    timestamp: number;
  }) => void | Promise<void>;

  hello: (data: { hello: "world" }) => void | Promise<void>;
}

export interface ClientToServerEvents {
  "message:send": (data: {
    to: string;
    message: MessageType;
    timestamp: number;
  }) => void | Promise<void>;
  "message:ack": (data: {
    lastReceivedMessageId: number;
  }) => void | Promise<void>;
  "keyBundle:save": (data: {
    registrationId: number;
    identityPubKey: ArrayBuffer;
    signedPreKey: SignedPublicPreKeyType<ArrayBuffer>;
    oneTimePreKeys: PreKeyType<ArrayBuffer>[];
  }) => void | Promise<void>;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.BACKEND_URL!,
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  }
);