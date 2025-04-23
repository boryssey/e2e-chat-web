'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logout() {
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
    const setCookieHeader = response.headers.getSetCookie()
    if (setCookieHeader.length) {
      setCookieHeader.map(async (cookie) => {
        const [cookieName, ...cookieAttributes] = cookie.split('=')
        const cookieStore = await cookies()
        cookieStore.set(cookieName, cookieAttributes.join('='), {
          httpOnly: true,
        })
      })
    }
    revalidateTag('user')
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
