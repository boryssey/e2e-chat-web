'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { handleServerCookies } from './serverUtils'
import { getResponseError } from '@/utils/helpers'
import { type ServerResponse } from '@/utils/types'
interface Inputs {
  username: string
  password: string
}

export async function login(
  data: Inputs,
  shouldRedirect?: boolean
): Promise<ServerResponse> {
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
  const errorMessage = getResponseError(
    await response.json(),
    response.statusText
  )
  return {
    success: false,
    errorMessage,
  }
}
