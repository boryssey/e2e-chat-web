import { HTMLAttributes } from 'react'
import styles from './loading.module.scss'

type LoadingProps = HTMLAttributes<HTMLDivElement>

function Loading(_props: LoadingProps) {
  return (
    <div className={styles.container}>
      <svg viewBox="0 0 100 100">
        <circle cx="50%" cy="50%" r={'42'} />
      </svg>
    </div>
  )
}
export default Loading
