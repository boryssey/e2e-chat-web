import { Contact, Message } from "@/utils/db";

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
    <div>
      {contacts.map(({ id, name }) => {
        return (
          <div
            key={id}
            style={{ fontWeight: selectedContact?.id === id ? 800 : 400 }}
            onClick={() => {
              setSelectedContact({ id, name });
            }}
          >
            {name}
          </div>
        );
      })}
    </div>
  );
};

export default ContactList;
