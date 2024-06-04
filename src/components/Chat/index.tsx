import AppDB, { Contact } from "@/utils/db";
import { useLiveQuery } from "dexie-react-hooks";
import styles from "./chat.module.scss";
import { FormEvent, useCallback, useState } from "react";

type ChatProps = {
  appDB: AppDB;
  contact: Contact;
  onSendMessage: (
    messageText: string,
    recipientUsername: string
  ) => void | Promise<void>;
};
const Chat = ({ appDB, contact, onSendMessage }: ChatProps) => {
  const [messageText, setMessageText] = useState("");
  const messages = useLiveQuery(
    () =>
      appDB.messages.where("contactId").equals(contact.id!).sortBy("timestamp"),
    [contact.id]
  );

  const handleSendMessage = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSendMessage(messageText, contact.name);
      setMessageText("");
    },
    [onSendMessage, messageText, contact.name]
  );
  return (
    <div className={styles.container}>
      <div className={styles.messageContainer}>
        {messages?.map((message) => {
          return (
            <div
              className={`${styles.message} ${
                message.isFromMe ? styles.myMessage : ""
              }`}
              key={message.id}
            >
              {message.message}-{message.timestamp}-{message.isFromMe}
            </div>
          );
        })}
      </div>
      <form
        className={styles.inputContainer}
        onSubmit={(e) => handleSendMessage(e)}
      >
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
