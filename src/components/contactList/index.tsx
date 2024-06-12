import { Contact, Message } from "@/utils/db";
import styles from "./contactList.module.scss";

const ContactList = ({
  selectedContact,
  contacts,
  setSelectedContact,
}: {
  contacts: (Contact & { lastMessage: Message | undefined })[];
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact) => void;
}) => {
  return (
    <div className={styles.container}>
      {contacts.map(({ id, name, lastMessage }) => {
        return (
          <div
            key={id}
            className={
              selectedContact?.id === id
                ? styles.activeItem
                : styles.contactItem
            }
            style={{ fontWeight: selectedContact?.id === id ? 800 : 400 }}
            onClick={() => {
              setSelectedContact({ id, name });
            }}
          >
            <p>{name}</p>
            <p>{lastMessage?.message}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ContactList;
