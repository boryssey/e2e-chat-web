import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import styles from './button.module.scss'

const Arrow = () => {
  return (
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="15"
        fill="none"
        viewBox="0 0 40 30"
      >
        <path
          fill="#1E201D"
          d="M26.936 1.36a1.412 1.412 0 00-2.016 0 1.422 1.422 0 000 1.996L35.14 13.578H1.411A1.404 1.404 0 000 14.99a1.42 1.42 0 001.411 1.432h33.73L24.92 26.624c-.545.564-.545 1.473 0 2.016.564.564 1.472.564 2.015 0L39.578 16a1.388 1.388 0 000-1.996L26.936 1.36z"
        ></path>
      </svg>
    </div>
  )
}

type ButtonProps = (
  | {
      withArrow?: boolean
      color?: 'primary' | 'secondary'
      empty?: false
    }
  | { empty: true; withArrow?: never; color?: never }
) &
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

const Button = ({
  children,
  empty = false,
  withArrow,
  color = 'primary',
  className,
  ...props
}: ButtonProps) => {
  if (empty) {
    return (
      <button
        className={`${styles.noStyle}${className ? ` ${className}` : ''}`}
        {...props}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      className={`${styles[color]}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children} {withArrow && <Arrow />}
    </button>
  )
}

export default Button
