import { useAuthContext } from '@/context/AuthContext'
import { useDbContext } from '@/context/DbContext'
import {
  getRemoteKeyBundle,
  useMessagingContext,
} from '@/context/MessagingContext'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import styles from './DebugMenu.module.scss'

const DebugMenu = () => {
  const { socketState } = useMessagingContext()

  const [isDebugMenuOpen, setIsDebugMenuOpen] = useState(false)
  const { logout } = useAuthContext()
  const { appDB, exportDb } = useDbContext()
  const router = useRouter()
  const logoutHandler = useCallback(async () => {
    const res = await logout()
    if (!res.success) {
      console.error(res.errorMessage)
      return
    }

    // router.push("/");
    router.refresh()

    console.log('logout success')
  }, [logout, router])
  return (
    <header>
      {isDebugMenuOpen && (
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
          {/* <button onClick={() => testSaveKeyBundle()}>testLocal</button> */}
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
          setIsDebugMenuOpen(!isDebugMenuOpen)
        }}
      >
        {isDebugMenuOpen ? '↑' : '↓'}
      </button>
    </header>
  )
}

export default DebugMenu
