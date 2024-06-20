import { redirect } from 'next/navigation'
import styles from './auth.module.scss'
import { cookies } from 'next/headers'
import { User } from '@/context/AuthContext'
import { LayoutProps } from '../../../../.next/types/app/layout'

const getUserInfo = async () => {
  const cookieStore = cookies()
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    credentials: 'include',
  })
  if (res.ok) {
    const data = (await res.json()) as User
    return data
  }
  return null
}

export default async function AuthLayout({ children }: LayoutProps) {
  const user = await getUserInfo()

  if (user) {
    redirect('/')
  }

  return (
    <main className={styles.authContainer}>
      <div className={styles.formWrapper}>{children}</div>
    </main>
  )
}
