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
import { emitEventWithAck } from '@/utils/socket'
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
  const { signalStore, appDB, exportDb, contacts } = useDbContext()
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
    await emitEventWithAck('keyBundle:save', keyBundle)
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
    <>
      <header>
        {isDepugMenuOpen && (
          <div>
            <button onClick={() => logoutHandler()}>Logout</button>
            <button onClick={() => getRemoteKeyBundle('boryss')}>
              testRemote
            </button>
            <a
              onClick={async () => {
                if (typeof window === 'undefined') {
                  return
                }
                const blob = await exportDb()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'db.json'
                document.body.appendChild(a)
                a.click()
              }}
            >
              export db
            </a>
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
      </header>
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
