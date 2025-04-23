'use client'

import { useContext, createContext } from 'react'
import { logout } from '@/app/actions/logout'
import { type ServerResponse } from '@/utils/types'
interface IAuthContext {
  user: User
  logout: () => Promise<ServerResponse>
}

const AuthContext = createContext<IAuthContext | null>(null)

export const useAuthContext = () => {
  const authContext = useContext(AuthContext)
  if (!authContext) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return authContext
}
export interface User {
  id: number
  username: string
  created_at: Date | null
  deleted_at: Date | null
}

const AuthProvider = ({
  userInfo,
  children,
}: {
  userInfo: User
  children: React.ReactNode
}) => {
  return (
    <AuthContext.Provider
      value={{
        user: userInfo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
