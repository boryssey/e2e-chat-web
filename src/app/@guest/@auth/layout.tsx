import { redirect } from 'next/navigation'
import styles from './auth.module.scss'
import { getUserInfo } from '@/app/actions/user'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
