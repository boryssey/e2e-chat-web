import { Contact } from '@/utils/db'
import styles from './chat.module.scss'
import { User } from '@geist-ui/icons'

interface ChatHeaderProps {
  contact: Contact
}

const ChatHeader = ({ contact }: ChatHeaderProps) => {
  return (
    <div className={styles.header}>
      <User />
      <p>{contact.name}</p>
    </div>
  )
}

export default ChatHeader
