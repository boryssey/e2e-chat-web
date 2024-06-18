'use client'
import DbContextProvider from '@/context/DbContext'
import MessagingContextProvider from '@/context/MessagingContext'

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DbContextProvider>
      <MessagingContextProvider>{children}</MessagingContextProvider>
    </DbContextProvider>
  )
}

export default UserLayout
