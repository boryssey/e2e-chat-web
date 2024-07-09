import AppDB, { Contact, Message } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import styles from './chat.module.scss'
import {
  FormEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DateTime } from 'luxon'
import ChatHeader from './ChatHeader'
import TextArea from '../TextArea'
import { Send } from '@geist-ui/icons'

interface ChatProps {
  appDB: AppDB
  contact: Contact | null
  onSendMessage: (
    messageText: string,
    recipientUsername: string,
    callback?: () => void
  ) => void | Promise<void>
}

const yesterdayDate = DateTime.local().minus({ days: 1 })

const Chat = ({ appDB, contact, onSendMessage }: ChatProps) => {
  const formRef = useRef<HTMLFormElement>(null)
  const [messageText, setMessageText] = useState('')
  const messages = useLiveQuery(
    () =>
      contact
        ? appDB.messages
            .where('contactId')
            .equals(contact.id!)
            .reverse()
            .sortBy('timestamp')
        : [],
    [contact?.id]
  )

  const messagesGroupedByDate = useMemo(() => {
    const grouped = new Map<string, Message[]>()
    messages?.forEach((message) => {
      const date = DateTime.fromMillis(message.timestamp)
      const formattedDate = date.toFormat('yyyy-MM-dd')
      if (!grouped.has(formattedDate)) {
        grouped.set(formattedDate, [])
      }
      grouped.get(formattedDate)?.push(message)
    })
    return grouped
  }, [messages])

  const handleSendMessage = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!contact || !messageText) {
        return
      }
      void onSendMessage(messageText, contact.name, () => {
        setMessageText('')
      })
    },
    [contact, messageText, onSendMessage]
  )

  useEffect(() => {
    setMessageText('')
  }, [contact?.id])
  return (
    <div className={styles.container}>
      {!contact ? (
        <div className={styles.emptyContainer}>No contact selected</div>
      ) : (
        <>
          <ChatHeader contact={contact} />
          <div className={styles.messageContainer}>
            {Array.from(messagesGroupedByDate).map(([date, messages]) => {
              const dateObj = DateTime.fromISO(date)
              return (
                <Fragment key={`${dateObj.toISO()}`}>
                  {messages.map((message) => {
                    const dateTime = DateTime.fromMillis(message.timestamp)
                    return (
                      <div
                        className={
                          message.isFromMe ? styles.myMessage : styles.message
                        }
                        key={message.id}
                      >
                        {message.message}
                        <span dir="ltr">
                          <time
                            dateTime={
                              dateTime.isValid ? dateTime.toISO() : undefined
                            }
                          >
                            {dateTime.toLocaleString({
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </time>
                        </span>
                      </div>
                    )
                  })}
                  <time dateTime={date} className={styles.dateMessage}>
                    {dateObj >= yesterdayDate
                      ? dateObj.setLocale('en-US').toRelativeCalendar()
                      : date}
                  </time>
                </Fragment>
              )
            })}
          </div>
          <form
            ref={formRef}
            className={styles.inputContainer}
            onSubmit={(e) => {
              handleSendMessage(e)
            }}
          >
            <TextArea
              value={messageText}
              aria-label="message text"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (formRef.current)
                    formRef.current.dispatchEvent(
                      new Event('submit', { cancelable: true, bubbles: true })
                    )
                }
              }}
              onChange={(e) => {
                setMessageText(e.target.value)
              }}
            />
            <button type="submit" aria-label="send message">
              <Send />
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default Chat
