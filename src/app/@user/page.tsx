"use client";

// import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ServerToClientEvents, socket } from "../socket";
import { encode as encodeBase64 } from "@stablelib/base64";
import {
  SignalProtocolIndexDBStore,
  arrayBufferToString,
} from "@/utils/EncryptedSignalStore";
import { createID, getID, stringToArrayBuffer } from "@/utils/signal";
import {
  MessageType,
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from "@privacyresearch/libsignal-protocol-typescript";
import AppDB, { Contact } from "@/utils/db";
import { useRouter } from "next/navigation";
import ContactList from "@/components/contactList";
import Chat from "@/components/Chat";
import { useAuthContext } from "@/context/authContext";

const getRemoteKeyBundle = async (username: string) => {
  const fetchedBundle = await fetch(
    `http://localhost:3000/user/${username}/keyBundle`,
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
    identityKey: Uint8Array.from(data[0].key_bundles.identity_pub_key.data)
      .buffer as ArrayBuffer,
  };
  return transformedBundle;
};

const UserPage = () => {
  console.log("user called?");
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false); // messaging context
  const [transport, setTransport] = useState("N/A"); // messaging context
  const [preKeybundle, setPreKeyBundle] = useState({} as any);
  const [signalStore, setSignalStore] =
    useState<SignalProtocolIndexDBStore | null>(null); // Signal context
  const [appDB, setAppDB] = useState<AppDB | null>(null); // Signal context
  const [recipientName, setRecipientName] = useState<string>("boryss3"); // tbd
  const { user, logout } = useAuthContext();

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const logoutHandler = useCallback(async () => {
    const res = await logout();
    if (!res.ok) {
      console.error(res.statusText);
      return;
    }

    // router.push("/");
    router.refresh();

    console.log("logout success");
  }, [logout, router]);

  const getOrCreateID = useCallback(async () => {
    if (!user) {
      console.error("no user");
      return;
    }
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
  }, [signalStore, user]);

  const onMessageReceive: ServerToClientEvents["message:receive"] = useCallback(
    async (messageData) => {
      const SenderName = messageData.from_user_username;
      console.log("🚀 ~ SenderName:", SenderName);
      const sender = new SignalProtocolAddress(SenderName, 1);
      const sessionCipher = new SessionCipher(signalStore!, sender);
      const message = messageData.message as MessageType;
      let contact = await appDB!.contacts.get({
        name: messageData.from_user_username,
      });
      console.log("🚀 ~ onMessageReceive ~ contact:", contact);
      if (!contact) {
        const contactId = await appDB!.contacts.add({ name: SenderName });
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
          contactId: contact.id!,
          timestamp: new Date(messageData.timestamp).getTime(),
          message: arrayBufferToString(decryptedMessage),
        };
        await appDB!.messages.add(decryptedMessageToSave);
        socket.emit("message:ack", {
          lastReceivedMessageId: messageData.id,
        });
        return;
      }
      console.warn("Received message of not supported type");
    },
    [appDB, signalStore]
  );

  const onMessageStored: ServerToClientEvents["messages:stored"] = useCallback(
    async (data) => {
      const promises = Object.entries(data).map(
        async ([senderUsername, messages]) => {
          const messagesPromise = messages.map(async (message) =>
            onMessageReceive({
              id: message.message.id,
              from_user_username: message.from_user_username,
              from_user_id: message.from_user_user_id,
              to_user_id: message.message.to_user_id,
              message: message.message.message as MessageType,
              timestamp: message.message.timestamp,
            })
          );
          return Promise.all(messagesPromise);
        }
      );
      await Promise.all(promises);
    },
    [onMessageReceive]
  );

  const onSendMessage = useCallback(
    async (messageText: string, recipientUsername: string) => {
      const recipientAddress = new SignalProtocolAddress(recipientUsername, 1);
      console.log("🚀 ~ onSendMessage ~ recipientName:", recipientUsername);
      if (!user) {
        console.error("No user yet");
        return;
      }
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
        }
        let contact = await appDB!.contacts.get({
          name: recipientUsername,
        });
        console.log("🚀 ~ onSendMessage ~ contact:", contact);
        if (!contact) {
          const contactId = await appDB!.contacts.add({
            name: recipientUsername,
          });
          contact = { id: contactId, name: recipientUsername };
        }
        // await sessionBuilder.processPreKey(transformedBundle);
        const sessionCipher = new SessionCipher(signalStore!, recipientAddress);
        const hasOpenSession = await sessionCipher.hasOpenSession();
        if (!hasOpenSession) {
          const sessionBuilder = new SessionBuilder(
            signalStore!,
            recipientAddress
          );
          const recipientBundle = await getRemoteKeyBundle(recipientUsername);
          await sessionBuilder.processPreKey(recipientBundle);
        }
        const encryptedMessage = await sessionCipher.encrypt(
          stringToArrayBuffer(messageText).buffer
        );

        const messageToSend = {
          to: recipientName,
          message: encryptedMessage,
          timestamp: Date.now(),
        };
        socket.emit("message:send", messageToSend);

        appDB?.messages.add({
          contactId: contact.id!,
          message: messageText,
          timestamp: messageToSend.timestamp,
          isFromMe: true,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [appDB, recipientName, signalStore, user]
  );

  useEffect(() => {
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
    }

    init();
    const localsignalStore = new SignalProtocolIndexDBStore();

    setSignalStore(localsignalStore);
  }, []);

  function onConnect() {
    console.log("onConnect");
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

  useEffect(() => {
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (!socket.connected && appDB && user && signalStore) {
      console.log("call connect");
      socket.connect();
    }
    function onHelloWorld(data: any) {
      console.log(data, "hello data");
    }
    socket.on("hello", onHelloWorld);
    socket.on("message:receive", onMessageReceive);
    socket.on("messages:stored", onMessageStored);

    return () => {
      socket.off("hello", onHelloWorld);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:receive", onMessageReceive);
      socket.off("messages:stored", onMessageStored);
    };
  }, [appDB, onMessageReceive, onMessageStored, signalStore, user]);

  return (
    <>
      <h1>UserPage</h1>
      <button onClick={() => logoutHandler()}>Logout</button>
      <button onClick={() => getOrCreateID()}>Get or Create ID</button>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
      <div>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
      </div>
      {isConnected && appDB && (
        <ContactList
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          appDB={appDB}
        />
      )}
      {isConnected && appDB && selectedContact && (
        <Chat
          appDB={appDB}
          onSendMessage={onSendMessage}
          contact={selectedContact}
        />
      )}
    </>
  );
};

export default UserPage;
