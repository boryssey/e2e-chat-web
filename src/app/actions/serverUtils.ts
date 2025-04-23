'use server'

import { cookies } from 'next/headers'

export async function handleServerCookies(headerCookies: string[]) {
  if (headerCookies.length) {
    const cookiePromises = headerCookies.map(async (cookie) => {
      const [cookieName, cookieValue] = cookie.split(';')[0].split('=')
      const cookieStore = await cookies()
      cookieStore.set(cookieName, cookieValue, {
        httpOnly: true,
      })
    })
    await Promise.all(cookiePromises)
  }
}
