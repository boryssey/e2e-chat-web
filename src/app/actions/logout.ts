'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { handleServerCookies } from './serverUtils'
import { getResponseError } from '@/utils/helpers'
import { type ServerResponse } from '@/utils/types'

const handleLogout = (shouldRedirect?: boolean): ServerResponse => {
  revalidateTag('user')
  revalidatePath('/', 'layout')
  if (shouldRedirect) {
    redirect('/')
  }
  return {
    success: true,
    data: null,
  }
}

export async function logout(
  shouldRedirect?: boolean
): Promise<ServerResponse> {
  const cookieStore = await cookies()
  if (!cookieStore.has('accessToken')) {
    return handleLogout(shouldRedirect)
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
    return handleLogout(shouldRedirect)
  }
  const errorMessage = getResponseError(
    await response.json(),
    response.statusText
  )
  return {
    success: false,
    errorMessage,
  }
}
