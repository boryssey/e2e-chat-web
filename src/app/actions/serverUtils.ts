'use server'

import { cookies } from 'next/headers'

export async function handleServerCookies(headerCookies: string[]) {
  if (headerCookies.length) {
    const cookiePromises = headerCookies.map(async (cookie) => {
      console.log('cookie', cookie)
      const [cookieName, ...cookieAttributes] = cookie.split('=')
      const cookieStore = await cookies()
      console.log('cookieName', cookieName)
      console.log('cookieAttributes', cookieAttributes)
      cookieStore.set(cookieName, cookieAttributes.join('='), {
        httpOnly: true,
      })
    })
    await Promise.all(cookiePromises)
  }
}
