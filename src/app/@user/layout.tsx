'use client'
import Modal, { ModalProvider } from '@/components/Modal'
import DbContextProvider from '@/context/DbContext'
import MessagingContextProvider from '@/context/MessagingContext'

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ModalProvider>
      <DbContextProvider>
        <MessagingContextProvider>
          {children} <Modal />
        </MessagingContextProvider>
      </DbContextProvider>
    </ModalProvider>
  )
}

export default UserLayout
