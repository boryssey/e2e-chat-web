import { SocketStateType } from '@/context/MessagingContext'
import styles from './connectionStatusIndicator.module.scss'

const mapping = {
  connected: 'Connected',
  lost_connection: 'Reconnecting',
  disconnected: 'Disconnected',
}

const ConnectionStatusIndicator = ({ status }: { status: SocketStateType }) => {
  const statusText = mapping[status]

  return (
    <div className={styles.container}>
      <div className={styles.status}>{statusText}</div>
      <div className={styles.indicator} data-status={status}></div>
    </div>
  )
}

export default ConnectionStatusIndicator
