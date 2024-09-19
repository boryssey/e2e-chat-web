'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logout() {
  const cookieStore = cookies()
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
  console.error(
    'Something went wrong went logging out',
    response.status,
    response.statusText
  )
  throw new Error('Server Error')
}
