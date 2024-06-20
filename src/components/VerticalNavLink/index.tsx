import classNames from 'classnames'
import Link, { LinkProps } from 'next/link'
import { HTMLAttributes } from 'react'

type VerticalNavLinkProps =
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

type LinkPropsWithAnchor = LinkProps & HTMLAttributes<HTMLAnchorElement>

const VerticalNavLink = ({
  children,
  reverse,
  primary,
  secondary,
  ...props
}: VerticalNavLinkProps & LinkPropsWithAnchor) => {
  const className = classNames({
    primary,
    secondary,
    reverse: !!reverse,
    verticalNavLink: true,
  })
  return (
    <Link {...props} replace className={className}>
      {children}
    </Link>
  )
}

export default VerticalNavLink
