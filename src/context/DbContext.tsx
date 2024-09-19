import { SignalProtocolIndexDBStore } from '@/utils/EncryptedSignalStore'
import AppDB, { Contact, Message } from '@/utils/db'
import { createContext, useContext, useEffect, useState } from 'react'
import { encode as encodeBase64 } from '@stablelib/base64'
import PasswordPrompt from '@/components/PasswordPrompt'
import { useLiveQuery } from 'dexie-react-hooks'
import { emitEventWithAck } from '@/utils/socket'
import { useAuthContext } from './AuthContext'
import Dexie from 'dexie'

interface IDbContext {
  status: StatusType
  appDB: AppDB
  signalStore: SignalProtocolIndexDBStore
  exportDb: () => Promise<Blob>
  contacts: (Contact & { lastMessage: Message | undefined })[] | undefined
}

const DbContext = createContext<IDbContext | null>(null)

export const useDbContext = () => {
  const dbContext = useContext(DbContext)

  if (!dbContext) {
    throw new Error('useDbContext must be used within a SignalProvider')
  }
  return dbContext
}

type StatusType = 'unregistered' | 'unauthenticated' | 'authenticated'

const makeSecretKey = (key: string) => {
  const encoder = new TextEncoder()
  const newInt8Array = new Uint8Array(32)
  encoder.encodeInto(key, newInt8Array)
  return encodeBase64(newInt8Array)
}

const contactsWithLastMessage = async (appDb: AppDB) => {
  const contacts = await appDb.contacts.toArray()
  return Promise.all(
    contacts.map(async (contact) => {
      const lastMessage = await appDb.messages
        .where({ contactId: contact.id })
        .last()
      return {
        ...contact,
        lastMessage,
      }
    })
  )
}

const DbContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [appDB, setAppDB] = useState<AppDB | null>(null)
  const [signalStore, setSignalStore] =
    useState<SignalProtocolIndexDBStore | null>(null)
  const [status, setStatus] = useState<StatusType | null>(null)
  const { user } = useAuthContext()
  const contacts = useLiveQuery(
    () => (appDB ? contactsWithLastMessage(appDB) : []),
    [status]
  )

  useEffect(() => {
    const init = async () => {
      const isAppDBInitialized = await AppDB.appDBExists(user.id)
      if (!isAppDBInitialized) {
        setStatus('unregistered')
        return
      }
      setStatus('unauthenticated')
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportDb = async () => {
    const newAppDB = await new Dexie(`${AppDB.dbName}-${user.id}`).open()
    const blob = await (
      await import('dexie-export-import')
    ).exportDB(newAppDB, {
      prettyJson: true,
    })
    return blob
  }

  const onInitDBs = async (password: string) => {
    const key = makeSecretKey(password) // TODO: use easy-web-crypto for creating a master password

    const appDB = new AppDB(key, user.id)
    try {
      await appDB.open()
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'DEXIE ENCRYPT ADDON: Encryption key has changed'
        ) {
          throw new Error('Wrong database password')
        } else {
          console.error(error)
          throw new Error('Failed to initialize database')
        }
      }
    }
    const localSignalStore = new SignalProtocolIndexDBStore(appDB)
    const existingID = await localSignalStore.getID()
    if (!existingID) {
      const newId = await localSignalStore.createID()
      try {
        emitEventWithAck('keyBundle:save', newId).catch((err: unknown) => {
          console.error('error', err)
        })
      } catch (error) {
        console.error(error)
      }
    }
    setSignalStore(localSignalStore)
    setAppDB(appDB)
    setStatus('authenticated')
  }

  if (!status) {
    return <div>Loading...</div>
  }

  if (status === 'unregistered' || status === 'unauthenticated') {
    return (
      <PasswordPrompt
        username={user.username}
        promptLabel={
          status === 'unauthenticated'
            ? 'Please enter your password to decrypt the database'
            : 'Please enter a password that will be used to encrypt your local database'
        }
        withConfirmation={status === 'unregistered'}
        onSubmit={onInitDBs}
      />
    )
  }

  if (appDB && signalStore) {
    return (
      <DbContext.Provider
        value={{
          status: status,
          appDB: appDB,
          signalStore: signalStore,
          exportDb,
          contacts,
        }}
      >
        {children}
      </DbContext.Provider>
    )
  }

  throw new Error('SignalProvider: unexpected state')
}

export default DbContextProvider
