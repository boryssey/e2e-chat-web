'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { handleServerCookies } from './utils'

interface Inputs {
  username: string
  password: string
  'confirm-password': string
}

export async function register(data: Inputs, shouldRedirect?: boolean) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    }
  )
  if (!response.ok) {
    const error = (await response.json()) as unknown
    const errorMessage =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : response.statusText

    return {
      success: false,
      errorMessage,
    }
  }
  if (response.ok) {
    await handleServerCookies(response.headers.getSetCookie())
    revalidatePath('/', 'layout')
    if (shouldRedirect) {
      redirect('/')
    }
    return {
      success: true,
    }
  }
  const error = (await response.json()) as unknown

  return {
    type: 'server_error',
    message:
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : response.statusText,
  }
}
