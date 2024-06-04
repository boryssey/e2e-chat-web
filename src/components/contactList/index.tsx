import AppDB, { Contact } from "@/utils/db";
import { useLiveQuery } from "dexie-react-hooks";

const ContactList = ({
  appDB,
  selectedContact,
  setSelectedContact,
}: {
  appDB: AppDB;
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact) => void;
}) => {
  const contacts = useLiveQuery(() => appDB.contacts.toArray());
  console.log("🚀 ~ ContactList ~ contacts:", contacts);

  return (
    <div>
      {contacts?.map(({ id, name }) => {
        return (
          <div
            key={id}
            style={{ fontWeight: selectedContact?.id === id ? 800 : 400 }}
            onClick={() => setSelectedContact({ id, name })}
          >
            {name}
          </div>
        );
      })}
    </div>
  );
};

export default ContactList;
