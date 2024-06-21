import classNames from 'classnames'
import Link from 'next/link'
import { HTMLAttributes } from 'react'

type StyleProps =
  | {
      reverse?: boolean
      primary?: true
      secondary?: false
    }
  | {
      reverse?: boolean
      secondary?: true
      primary?: false
    }

type ButtonProps =
  | {
      asLink?: true
      children?: React.ReactNode
      href: string
    }
  | {
      href?: never
      asLink?: false
      children?: React.ReactNode
      onClick?: () => void
    }

const Button = (props: HTMLAttributes<HTMLButtonElement>) => (
  <Button {...props} />
)

function VerticalNavigationButton({
  children,
  reverse,
  primary,
  secondary,
  asLink,
  href,
  ...props
}: ButtonProps & StyleProps) {
  const className = classNames({
    primary,
    secondary,
    reverse: !!reverse,
    verticalNavLink: true,
  })
  if (asLink && href) {
    return (
      <Link href={href} {...props} replace className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button {...props} className={className}>
      {children}
    </button>
  )
}

export default VerticalNavigationButton
