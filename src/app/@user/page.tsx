"use client";

// import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { useAuthContext } from "@/context/AuthContext";

import {
  getRemoteKeyBundle,
  useMessagingContext,
} from "@/context/MessagingContext";
import { useDbContext } from "@/context/DbContext";
import { socket } from "@/utils/socket";

const UserPage = () => {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState<string>("boryss3"); // tbd
  const { logout } = useAuthContext();
  const { signalStore } = useDbContext();

  const { socketState } = useMessagingContext();

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
  const testSaveKeyBundle = useCallback(async () => {
    const keyBundle = await signalStore.createID();
    await socket.emitWithAck("keyBundle:save", keyBundle);
  }, [signalStore]);
  return (
    <>
      <h1>UserPage</h1>
      <button onClick={() => void logoutHandler()}>Logout</button>
      <button onClick={() => getRemoteKeyBundle("boryss")}>testRemote</button>
      <button onClick={() => testSaveKeyBundle()}>testLocal</button>
      <p>Status: {socketState}</p>
      <div>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => {
            setRecipientName(e.target.value);
          }}
        />
      </div>
      {/* {isConnected && appDB && (
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
      )} */}
    </>
  );
};

export default UserPage;
