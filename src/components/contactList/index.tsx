import { Contact, Message } from '@/utils/db'
import styles from './contactList.module.scss'

const ContactList = ({
  selectedContact,
  contacts,
  setSelectedContact,
}: {
  contacts: (Contact & { lastMessage: Message | undefined })[]
  selectedContact: Contact | null
  setSelectedContact: (contact: Contact | null) => void
}) => {
  return (
    <div className={styles.container}>
      {contacts.map(({ id, name, lastMessage }) => {
        const isSelectedContact = selectedContact?.id === id
        return (
          <div
            key={id}
            className={
              isSelectedContact ? styles.activeItem : styles.contactItem
            }
            onClick={() => {
              setSelectedContact(isSelectedContact ? null : { id, name })
            }}
          >
            <p>{name}</p>
            <p>{lastMessage?.message}</p>
          </div>
        )
      })}
    </div>
  )
}

export default ContactList
