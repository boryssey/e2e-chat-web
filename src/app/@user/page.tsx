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
import { Contact } from "@/utils/db";
import ContactList from "@/components/ContactList";
import Chat from "@/components/Chat";

const UserPage = () => {
  const router = useRouter();

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { logout } = useAuthContext();
  const { signalStore, appDB, contacts } = useDbContext();

  const { socketState, sendMessage } = useMessagingContext();

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
      <button onClick={() => logoutHandler()}>Logout</button>
      <button onClick={() => getRemoteKeyBundle("boryss")}>testRemote</button>
      <button onClick={() => testSaveKeyBundle()}>testLocal</button>
      <p>Status: {socketState}</p>
      <div>
        <input type="text" id="recipientNameInput" />
        <button
          onClick={() => {
            const inputElement = document.getElementById(
              "recipientNameInput",
            ) as HTMLInputElement | null;
            if (!inputElement) {
              return;
            }
            const recipientName = inputElement.value;
            appDB
              .addContact(recipientName)
              .then(() => {
                inputElement.value = "";
              })
              .catch((error: unknown) => {
                console.error(error);
              });
          }}
        >
          Add contact
        </button>
      </div>
      {contacts && (
        <ContactList
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          contacts={contacts}
        />
      )}
      {selectedContact && (
        <Chat
          appDB={appDB}
          onSendMessage={sendMessage}
          contact={selectedContact}
        />
      )}
    </>
  );
};

export default UserPage;
