import { DetailedHTMLProps, InputHTMLAttributes, forwardRef } from 'react'
import styles from './input.module.scss'
import { XCircle } from '@geist-ui/icons'
import classNames from 'classnames'

type InputProps = {
  type: 'text' | 'password'
  color?: 'secondary' | 'primary'
  outlined?: boolean
  onCancel?: () => void
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

type InpurRef = HTMLInputElement

const Input = forwardRef<InpurRef, InputProps>(function Input(
  { color = 'primary', outlined, onCancel, ...props },
  ref
) {
  const className = classNames([styles[color], outlined && styles.outlined])
  return (
    <div className={styles.inputContainer}>
      <input ref={ref} className={className} {...props} />
      {onCancel && <XCircle className={styles.cancelIcon} onClick={onCancel} />}
    </div>
  )
})

export default Input
