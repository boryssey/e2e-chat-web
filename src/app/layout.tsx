import type { Metadata } from 'next'

import './globals.scss'
import biotif from './font'
import AuthProvider from '@/context/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import { getUserInfo } from './actions/user'

export const metadata: Metadata = {
  title: 'ChatE2E',
  description: 'Simple E2EE Chat App',
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
