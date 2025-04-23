'use client'

import { useState } from 'react'

import { useMessagingContext } from '@/context/MessagingContext'
import { useDbContext } from '@/context/DbContext'
// import { emitEventWithAck } from '@/utils/socket'
import { Contact } from '@/utils/db'
import ContactList from '@/components/ContactList'
import Chat from '@/components/Chat'
import styles from './user.module.scss'
import classNames from 'classnames'
import VerticalNavigationButton from '@/components/VerticalNavigationButton'
import DebugMenu from '@/components/DebugMenu'

const UserPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const { appDB, contacts } = useDbContext()

  const { sendMessage } = useMessagingContext()

  // const testSaveKeyBundle = useCallback(async () => {
  //   const keyBundle = await signalStore.createID()
  //   await emitEventWithAck('keyBundle:save', keyBundle)
  // }, [signalStore])
  // // arrow up

  const containerClassName = classNames({
    [styles.container]: !isChatOpen,
    [styles.containerChatOpen]: isChatOpen,
  })

  const handleNavButtonClick = () => {
    setIsChatOpen(!isChatOpen)
    if (isChatOpen) {
      setSelectedContact(null)
    }
  }

  return (
    <>
      <DebugMenu />
      <main className={containerClassName}>
        {contacts && (
          <>
            {selectedContact && (
              <VerticalNavigationButton
                onClick={handleNavButtonClick}
                reverse={isChatOpen}
              >
                {isChatOpen ? '↑ CONTACTS ' : '↑ CHAT'}
              </VerticalNavigationButton>
            )}
            <ContactList
              selectedContact={selectedContact}
              setSelectedContact={(contact: Contact | null) => {
                if (contact) {
                  setIsChatOpen(true)
                }
                setSelectedContact(contact)
              }}
              contacts={contacts}
            />
            <Chat
              appDB={appDB}
              onSendMessage={sendMessage}
              contact={selectedContact}
            />
          </>
        )}
      </main>
    </>
  )
}

export default UserPage
