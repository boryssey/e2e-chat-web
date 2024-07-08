import type { Metadata } from 'next'

import './globals.scss'
import biotif from './font'
import { cookies } from 'next/headers'
import AuthProvider, { User } from '@/context/AuthContext'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'ChatE2E',
  description: 'Simple E2EE Chat App',
}

const getUserInfo = async () => {
  const cookieStore = cookies()

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    credentials: 'include',
  })
  if (res.ok) {
    const data = (await res.json()) as unknown
    return data as User
  }
  console.error(res.statusText)
  return null
}

export default async function RootLayout({
  guest,
  user,
}: Readonly<{
  children: React.ReactNode
  guest: React.ReactNode
  user: React.ReactNode
}>) {
  const userInfo = await getUserInfo()

  return (
    <html lang="en">
      <body className={biotif.className}>
        {userInfo ? (
          <AuthProvider userInfo={userInfo}> {user}</AuthProvider>
        ) : (
          guest
        )}
        <Analytics />
      </body>
    </html>
  )
}
