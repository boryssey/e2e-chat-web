'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { handleServerCookies } from './utils'

export async function logout(shouldRedirect?: boolean) {
  const cookieStore = await cookies()
  if (!cookieStore.has('accessToken')) {
    return null
  }
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`,
    {
      method: 'GET',
      headers: {
        Cookie: cookieStore.toString(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  )
  if (response.ok) {
    await handleServerCookies(response.headers.getSetCookie())
    revalidateTag('user')
    revalidatePath('/', 'layout')
    if (shouldRedirect) {
      redirect('/')
    }
    return {
      success: true,
    }
  }
  console.error(
    'Something went wrong went logging out',
    response.status,
    response.statusText
  )
  throw new Error('Server Error')
}
