'use client'

// import { useRouter } from "next/navigation";
import { useCallback, useState } from 'react'

import { useRouter } from 'next/navigation'

import { useAuthContext } from '@/context/AuthContext'

import {
  getRemoteKeyBundle,
  useMessagingContext,
} from '@/context/MessagingContext'
import { useDbContext } from '@/context/DbContext'
import { socket } from '@/utils/socket'
import { Contact } from '@/utils/db'
import ContactList from '@/components/ContactList'
import Chat from '@/components/Chat'
import styles from './user.module.scss'
import classNames from 'classnames'
import VerticalNavigationButton from '@/components/VerticalNavigationButton'

const UserPage = () => {
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const { logout } = useAuthContext()
  const { signalStore, appDB, contacts } = useDbContext()
  const [isDepugMenuOpen, setIsDebugMenuOpen] = useState(false)

  const { socketState, sendMessage } = useMessagingContext()

  const logoutHandler = useCallback(async () => {
    const res = await logout()
    if (!res.ok) {
      console.error(res.statusText)
      return
    }

    // router.push("/");
    router.refresh()

    console.log('logout success')
  }, [logout, router])

  const testSaveKeyBundle = useCallback(async () => {
    const keyBundle = await signalStore.createID()
    await socket.emitWithAck('keyBundle:save', keyBundle)
  }, [signalStore])
  // arrow up

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
    <main className={styles.mainContainer}>
      <div>
        {isDepugMenuOpen && (
          <div>
            <button onClick={() => logoutHandler()}>Logout</button>
            <button onClick={() => getRemoteKeyBundle('boryss')}>
              testRemote
            </button>
            <button onClick={() => testSaveKeyBundle()}>testLocal</button>
            <p>Status: {socketState}</p>
            <div>
              <input type="text" id="recipientNameInput" />
              <button
                onClick={() => {
                  const inputElement = document.getElementById(
                    'recipientNameInput'
                  ) as HTMLInputElement | null
                  if (!inputElement) {
                    return
                  }
                  const recipientName = inputElement.value
                  appDB
                    .addContact(recipientName)
                    .then(() => {
                      inputElement.value = ''
                    })
                    .catch((error: unknown) => {
                      console.error(error)
                    })
                }}
              >
                Add contact
              </button>
            </div>
          </div>
        )}
        <button
          className={styles.debugButton}
          onClick={() => {
            setIsDebugMenuOpen(!isDepugMenuOpen)
          }}
        >
          {isDepugMenuOpen ? '↑' : '↓'}
        </button>
      </div>
      <div className={containerClassName}>
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
      </div>
    </main>
  )
}

export default UserPage
