"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { socket } from "../socket";
import {
  SignalProtocolIndexDBStore,
  arrayBufferToString,
  toArrayBuffer,
} from "@/utils/EncryptedSignalStore";
import { createID, getID, stringToArrayBuffer } from "@/utils/signal";
import {
  DeviceType,
  MessageType,
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from "@privacyresearch/libsignal-protocol-typescript";
import { set } from "idb-keyval";

const getUserData = async () =>
  fetch("http://localhost:3000/auth/me", {
    method: "GET",
    credentials: "include",
  });

const UserPage = () => {
  console.log("user called?");
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [preKeybundle, setPreKeyBundle] = useState({} as any);
  const [signalStore, setSignalStore] =
    useState<SignalProtocolIndexDBStore | null>(null);
  const [recipientName, setRecipientName] = useState<string>("boryss3");
  const [recipientBundle, setRecipientBundle] =
    useState<DeviceType<ArrayBuffer> | null>(null);
  const [user, setUser] = useState<any>(null);

  const logoutHandler = useCallback(async () => {
    const res = await fetch("http://localhost:3000/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      console.error(res.statusText);
      return;
    }

    // router.push("/");
    router.refresh();

    console.log("logout success");
  }, [router]);

  const getOrCreateID = async () => {
    const savedId = await getID(signalStore!);
    if (!savedId) {
      const keyBundle = await createID(user.username, signalStore!);
      console.log("🚀 ~ getOrCreateID ~ keyBundle:", keyBundle);
      setPreKeyBundle(keyBundle);
      return;
    }
    console.log("🚀 ~ initStore ~ savedId:", savedId);
    if (savedId) {
      setPreKeyBundle(savedId);
    }
  };

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    async function init() {
      if (socket.connected) {
        onConnect();
      }
      const fetchedUser = await getUserData();
      const newUserData = await fetchedUser.json();
      setUser(newUserData);
    }
    init();
    const localsignalStore = new SignalProtocolIndexDBStore();

    setSignalStore(localsignalStore);

    async function onMessageReceive(data: any) {
      const sender = new SignalProtocolAddress(data.from, 1);
      const sessionCipher = new SessionCipher(localsignalStore, sender);

      const message = data.message as MessageType;
      console.log("🚀 ~ socket.on ~ message:", message);

      if (message.type === 3) {
        const decryptedMessage =
          await sessionCipher.decryptPreKeyWhisperMessage(
            message.body!,
            "binary"
          );
        console.log(arrayBufferToString(decryptedMessage), "decryptedMessage3");
        return;
      } else if (message.type === 1) {
        const decryptedMessage = await sessionCipher.decryptWhisperMessage(
          message.body!,
          "binary"
        );
        console.log(arrayBufferToString(decryptedMessage), "decryptedMessage1");
        return;
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("hello", (data: any) => console.log(data, "hello data"));
    socket.on("message:receive", onMessageReceive);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:receive", onMessageReceive);
    };
  }, []);

  const buildSessionWithRecpient = async () => {
    const recipientAddress = new SignalProtocolAddress(recipientName, 1);

    try {
      let existingSession = await signalStore?.loadSession(
        recipientAddress.toString()
      );
      console.log(
        "🚀 ~ buildSessionWithRecpient ~ existingSession:",
        existingSession
      );
      if (!existingSession) {
        console.log("session not found, creating new session");
        const sessionBuilder = new SessionBuilder(
          signalStore!,
          recipientAddress
        );
        await sessionBuilder.processPreKey(recipientBundle!);
      }
      // await sessionBuilder.processPreKey(transformedBundle);
      const testMessage = "Hello, this is a test message" + Date.now();
      const sessionCipher = new SessionCipher(signalStore!, recipientAddress);
      const encryptedMessage = await sessionCipher.encrypt(
        stringToArrayBuffer(testMessage).buffer
      );
      socket.emit("message:send", {
        from: user.username,
        to: recipientName,
        message: encryptedMessage,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(error);
    }
    // console.log(sessionCipher, "sessionCipher");
  };

  return (
    <>
      <h1>UserPage</h1>
      <button onClick={() => logoutHandler()}>Logout</button>
      <button
        onClick={async () => {
          await buildSessionWithRecpient();
        }}
      >
        Chat
      </button>
      <button
        onClick={async () => {
          await getOrCreateID();
        }}
      >
        get keyBundle
      </button>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
      <div>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
        <button
          onClick={async () => {
            const fetchedBundle = await fetch(
              `http://localhost:3000/user/${recipientName}/keyBundle`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            const data = await fetchedBundle.json();
            console.log("🚀 ~ onClick={ ~ data:", data);
            const transformedBundle = {
              registrationId: data[0].key_bundles.registration_id,
              preKey: {
                keyId: data[0].one_time_keys.key_id,
                publicKey: Uint8Array.from(data[0].one_time_keys.pub_key.data)
                  .buffer as ArrayBuffer,
              },
              signedPreKey: {
                keyId: data[0].key_bundles.signed_pre_key_id,
                publicKey: Uint8Array.from(
                  data[0].key_bundles.signed_pre_key_pub_key.data as number[]
                ).buffer as ArrayBuffer,
                signature: Uint8Array.from(
                  data[0].key_bundles.signed_pre_key_signature.data
                ).buffer as ArrayBuffer,
              },
              identityKey: Uint8Array.from(
                data[0].key_bundles.identity_pub_key.data
              ).buffer as ArrayBuffer,
            };
            setRecipientBundle(transformedBundle);
            console.log(transformedBundle, "keyBundle");
          }}
        >
          Fetch keybundle for user
        </button>
      </div>
      <p>
        KeyBundle:
        {JSON.stringify(preKeybundle)}
      </p>
      <p>Recipient bundle: {JSON.stringify(recipientBundle, null, 2)}</p>
    </>
  );
};

export default UserPage;
