'use client'
import VerticalNavLink from '@/components/VerticalNavigationButton'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NavLink() {
  const pathname = usePathname()
  const fromQuery = useSearchParams().get('from')
  const [href, setHref] = useState('/login')

  useEffect(() => {
    if (
      !pathname.includes('/login') &&
      !pathname.includes('/register') &&
      fromQuery
    ) {
      setHref(`/${fromQuery}`)
      window.history.replaceState(null, '', '/')
    }
  }, [pathname, fromQuery])

  if (pathname.includes('login') || pathname.includes('register')) {
    return null
  }
  return (
    <VerticalNavLink asLink secondary href={href}>
      ↑ {href === '/login' ? 'LOGIN' : 'REGISTER'}
    </VerticalNavLink>
  )
}
