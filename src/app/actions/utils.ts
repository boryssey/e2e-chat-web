'use server'

import { cookies } from 'next/headers'

export async function handleServerCookies(headerCookies: string[]) {
  if (headerCookies.length) {
    const cookiePromises = headerCookies.map(async (cookie) => {
      const [cookieName, ...cookieAttributes] = cookie.split('=')
      const cookieStore = await cookies()
      cookieStore.set(cookieName, cookieAttributes.join('='), {
        httpOnly: true,
      })
    })
    await Promise.all(cookiePromises)
  }
}
