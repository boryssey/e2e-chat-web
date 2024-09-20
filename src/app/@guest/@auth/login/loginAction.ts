'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface Inputs {
  username: string
  password: string
}

export async function login(data: Inputs) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    }
  )
  if (response.ok) {
    const setCookieHeader = response.headers.getSetCookie()
    if (setCookieHeader.length) {
      setCookieHeader.forEach((cookie) => {
        const [cookieName, ...cookieAttributes] = cookie.split('=')
        cookies().set(cookieName, cookieAttributes.join('='), {
          httpOnly: true,
        })
      })
    }
    revalidatePath('/', 'layout')
    redirect('/')
  }
  const error = (await response.json()) as unknown
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return {
      type: 'server_error',
      message: error.message,
    }
  }
  return {
    type: 'server_error',
    message: response.statusText,
  }
}
