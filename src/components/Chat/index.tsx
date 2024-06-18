import AppDB, { Contact, Message } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import styles from './chat.module.scss'
import { FormEvent, Fragment, useCallback, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import Input from '../Input'
import ChatHeader from './ChatHeader'

interface ChatProps {
  appDB: AppDB
  contact: Contact | null
  onSendMessage: (
    messageText: string,
    recipientUsername: string
  ) => void | Promise<void>
}

const yesterdayDate = DateTime.local().minus({ days: 1 })

const Chat = ({ appDB, contact, onSendMessage }: ChatProps) => {
  const [messageText, setMessageText] = useState('')
  const messages = useLiveQuery(
    () =>
      contact
        ? appDB.messages
            .where('contactId')
            .equals(contact.id!)
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
      void onSendMessage(messageText, contact.name)
      setMessageText('')
    },
    [contact, messageText, onSendMessage]
  )
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
                  <time dateTime={date} className={styles.dateMessage}>
                    {dateObj >= yesterdayDate
                      ? dateObj.setLocale('en-US').toRelativeCalendar()
                      : date}
                  </time>
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
                      </div>
                    )
                  })}
                </Fragment>
              )
            })}
          </div>
          <form
            className={styles.inputContainer}
            onSubmit={(e) => {
              handleSendMessage(e)
            }}
          >
            <Input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value)
              }}
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  )
}

export default Chat
