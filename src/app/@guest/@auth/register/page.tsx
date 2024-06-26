'use client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { useForm, SubmitHandler } from 'react-hook-form'
import styles from '../auth.module.scss'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import VerticalNavLink from '@/components/VerticalNavigationButton'
import Link from 'next/link'

interface Inputs {
  username: string
  password: string
  confirmPassword: string
}

export default function LoginPage() {
  const [registerError, setRegisterError] = useState<string | null>(null)
  const hasOpenParam = useSearchParams().has('open')

  const router = useRouter()

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()

  const onRegister: SubmitHandler<Inputs> = async (data) => {
    const res = await fetch(
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
    if (!res.ok) {
      const error = (await res.json()) as { message: string }
      setRegisterError(error.message)
      return
    }
    setRegisterError(null)
    router.push('/')
  }

  return (
    <>
      {hasOpenParam && (
        <VerticalNavLink asLink href={'/register'} reverse>
          ↑ ABOUT
        </VerticalNavLink>
      )}

      <h1>Sign up</h1>
      <form
        className={hasOpenParam ? 'open' : ''}
        onSubmit={handleSubmit(onRegister)}
        id="loginForm"
      >
        <Input
          {...register('username', {
            required: { value: true, message: 'Username is required' },
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters',
            },
            maxLength: {
              value: 20,
              message: 'Username must be at most 20 characters',
            },
          })}
          name="username"
          placeholder="Username"
          type="text"
        />
        <Input
          {...register('password', {
            required: { value: true, message: 'Password is required' },
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            maxLength: {
              value: 20,
              message: 'Password must be at most 20 characters',
            },
            validate: {
              uppercase: (value) =>
                /[A-Z]/.test(value) ||
                'Password must contain an uppercase letter',
              lowercase: (value) =>
                /[a-z]/.test(value) ||
                'Password must contain a lowercase letter',
              number: (value) =>
                /[0-9]/.test(value) || 'Password must contain a number',
              specialCharacter: (value) =>
                /[!@#$%^&*]/.test(value) ||
                'Password must contain a special character',
            },
          })}
          name="password"
          placeholder="Password"
          type="password"
        />
        <Input
          {...register('confirmPassword', {
            required: { value: true, message: 'Confirm Password is required' },
            validate: {
              value: (value) =>
                value === watch('password') || 'Passwords do not match',
            },
          })}
          name="confirmPassword"
          placeholder="Confirm Password"
          type="password"
        />
      </form>
      {Object.values(errors).length > 0 && (
        <div className={styles.errorWrapper}>
          {registerError && <p>{registerError}</p>}
          {Object.values(errors).map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
      <div className={styles.actionWrapper}>
        <Link href={`/login${hasOpenParam ? '?open' : ''}`}>
          Sign in instead
        </Link>
        <Button form="loginForm" withArrow>
          SIGN UP
        </Button>
      </div>
    </>
  )
}
