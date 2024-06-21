'use client'
import VerticalNavLink from '@/components/VerticalNavigationButton'
import { useSearchParams } from 'next/navigation'

export default function NavLink() {
  const hasOpenParam = useSearchParams().has('open')
  if (hasOpenParam) {
    return null
  }
  return (
    <VerticalNavLink secondary href={'?open'}>
      ↑ LOGIN
    </VerticalNavLink>
  )
}
