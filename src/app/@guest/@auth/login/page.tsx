'use client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'
import styles from '../auth.module.scss'
import { useCallback, useState } from 'react'
import VerticalNavLink from '@/components/VerticalNavigationButton'
import Link from 'next/link'

interface Inputs {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const hasOpenParam = useSearchParams().has('open')

  const [loginError, setLoginError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const onLogin: SubmitHandler<Inputs> = useCallback(
    async (data, event) => {
      event?.preventDefault()
      const res = await fetch(
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

      if (!res.ok) {
        const error = (await res.json()) as { message: string }
        console.error(error, 'error')
        setLoginError(error.message)
        return
      }

      console.log(res, 'res success')
      router.push('/')
      router.refresh()
    },
    [router]
  )

  return (
    <>
      {hasOpenParam && (
        <VerticalNavLink asLink href={'/login'} reverse>
          ↑ ABOUT
        </VerticalNavLink>
      )}

      <h1>Sign in</h1>
      <form
        className={hasOpenParam ? 'open' : ''}
        onSubmit={handleSubmit(onLogin)}
        id="loginForm"
      >
        <Input
          {...register('username', {
            required: { value: true, message: 'Username is required' },
          })}
          name="username"
          placeholder="Username"
          type="text"
        />
        <Input
          {...register('password', {
            required: { value: true, message: 'Password is required' },
          })}
          name="password"
          placeholder="Password"
          type="password"
        />
      </form>
      {Object.values(errors).length > 0 && (
        <div className={styles.errorWrapper}>
          {loginError && <p>{loginError}</p>}
          {Object.values(errors).map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
      <div className={styles.actionWrapper}>
        <Link href={`/register${hasOpenParam ? '?open' : ''}`}>
          Sign up instead
        </Link>

        <Button form="loginForm" withArrow>
          <b>SIGN IN</b>
        </Button>
      </div>
    </>
  )
}
