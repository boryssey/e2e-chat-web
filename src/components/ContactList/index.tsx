import { Contact, Message } from '@/utils/db'
import styles from './contactList.module.scss'
import { DateTime } from 'luxon'
import ContactsHeader from './ContactsHeader'
import { useDbContext } from '@/context/DbContext'

const ContactList = ({
  selectedContact,
  contacts,
  setSelectedContact,
}: {
  contacts: (Contact & { lastMessage: Message | undefined })[]
  selectedContact: Contact | null
  setSelectedContact: (contact: Contact | null) => void
}) => {
  const { appDB } = useDbContext()

  const onAddContact = async (contactName: string) =>
    appDB.addContact(contactName).catch((error: unknown) => {
      console.error(error)
    })

  return (
    <div className={styles.container}>
      <ContactsHeader onAddContact={onAddContact} />
      <div className={styles.contactList}>
        {contacts.map(({ id, name, lastMessage }) => {
          const isSelectedContact = selectedContact?.id === id
          const date =
            lastMessage &&
            DateTime.fromMillis(lastMessage.timestamp).setLocale('en-US')
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
              <div className={styles.contactHeader}>
                <p>{name}</p>
                {date && (
                  <span>
                    {DateTime.now().hasSame(date, 'day')
                      ? date.toFormat('HH:ss')
                      : date.toFormat('ccc').toLowerCase()}
                  </span>
                )}
              </div>
              <p className={styles.lastMessage}>
                {lastMessage ? (
                  lastMessage.message
                ) : (
                  <i>
                    {'<'}no messages yet{'>'}
                  </i>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ContactList
