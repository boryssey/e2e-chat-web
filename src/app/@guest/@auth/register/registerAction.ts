'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface Inputs {
  username: string
  password: string
  'confirm-password': string
}

export async function register(data: Inputs) {
  try {
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
    throw new Error(
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : response.statusText
    )
  } catch (error) {
    console.error(error)
    throw new Error('Something went wrong')
  }
}