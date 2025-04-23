'use server'
import { User } from '@/context/AuthContext'
import { cookies } from 'next/headers'

export const getUserInfo = async () => {
  const cookieStore = await cookies()
  if (!cookieStore.has('accessToken')) {
    return null
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    next: {
      tags: ['user'],
    },
    credentials: 'include',
  })
  if (res.ok) {
    const data = (await res.json()) as unknown
    return data as User
  }
  //   console.error(res.statusText)
  return null
}
