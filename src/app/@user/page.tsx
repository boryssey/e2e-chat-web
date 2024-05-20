"use client";

// import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ServerToClientEvents, socket } from "../socket";
import {
  decode as decodeBase64,
  encode as encodeBase64,
} from "@stablelib/base64";
import {
  SignalProtocolIndexDBStore,
  arrayBufferToString,
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
import AppDB from "@/utils/db";
import { useRouter } from "next/navigation";

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
  const [appDB, setAppDB] = useState<AppDB | null>(null);
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
      const testBuffer = savedId.identityKeyPair.privKey.toString();
      console.log("json", JSON.stringify(savedId.identityKeyPair.privKey));
      console.log(
        "🚀 ~ getOrCreateID ~ testBuffer:",
        testBuffer,
        savedId.identityKeyPair.privKey
      );
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
    const encoder = new TextEncoder();
    const newInt8Array = new Uint8Array(32);
    encoder.encodeInto("tmpsecretkey", newInt8Array);
    const db = new AppDB(encodeBase64(newInt8Array));
    setAppDB(db);
    async function init() {
      await db.open();
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

    const onMessageReceive: ServerToClientEvents["message:receive"] = async (
      messageData
    ) => {
      const SenderName = messageData.from as string;
      const sender = new SignalProtocolAddress(SenderName, 1);
      const sessionCipher = new SessionCipher(localsignalStore, sender);
      const message = messageData.message as MessageType;
      let contact = await db!.contacts.get({ name: messageData.from });
      console.log("🚀 ~ onMessageReceive ~ contact:", contact);
      if (!contact) {
        const contactId = await db!.contacts.add({ name: SenderName });
        contact = { id: contactId, name: SenderName };
      }
      console.log("🚀 ~ socket.on ~ message:", message);
      let decryptedMessage;
      if (message.type === 3) {
        decryptedMessage = await sessionCipher.decryptPreKeyWhisperMessage(
          message.body!,
          "binary"
        );
        console.log(arrayBufferToString(decryptedMessage), "decryptedMessage3");
      } else if (message.type === 1) {
        decryptedMessage = await sessionCipher.decryptWhisperMessage(
          message.body!,
          "binary"
        );
        console.log(arrayBufferToString(decryptedMessage), "decryptedMessage1");
      }
      if (decryptedMessage) {
        const decryptedMessageToSave = {
          senderId: contact.id!,
          timestamp: messageData.timestamp,
          message: arrayBufferToString(decryptedMessage),
        };
        console.log("saving", decryptedMessageToSave);
        await db!.messages.add(decryptedMessageToSave);
      }
      console.warn("Received message of not supported type");
    };
    const onMessageStored: ServerToClientEvents["messages:stored"] = async (
      data
    ) => {
      const promises = Object.entries(data).map(
        async ([senderUsername, messages]) => {
          const messagesPromise = messages.map(async (message) =>
            onMessageReceive({
              from: message.from_user_username,
              to: "test???",
              message: message.message.message as MessageType,
              timestamp: message.message.timestamp,
            })
          );
          return Promise.all(messagesPromise);
        }
      );
      await Promise.all(promises);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("hello", (data: any) => console.log(data, "hello data"));
    socket.on("message:receive", onMessageReceive);
    socket.on("messages:stored", onMessageStored);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:receive", onMessageReceive);
      socket.off("messages:stored", onMessageStored);
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
