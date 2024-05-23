"use client";

import { MessageType } from "@privacyresearch/libsignal-protocol-typescript";
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
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:3000",
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  }
);
