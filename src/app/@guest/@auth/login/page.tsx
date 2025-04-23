'use client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { usePathname } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'
import styles from '../auth.module.scss'
import { useCallback } from 'react'
import VerticalNavLink from '@/components/VerticalNavigationButton'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { login } from '@/app/actions/login'

interface Inputs {
  username: string
  password: string
}

export default function LoginPage() {
  const pathname = usePathname()
  const isOpen = pathname.includes('/login')
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: isLoading },
  } = useForm<Inputs>()

  const onLogin: SubmitHandler<Inputs> = useCallback(
    async (data, event) => {
      event?.preventDefault()
      const res = await login(data, true)
      if (res.success) {
        router.refresh()
        router.push('/')
      } else {
        setError('password', {
          type: 'server_error',
          message: res.errorMessage,
        })
      }
    },
    [setError, router]
  )

  return (
    <>
      {isOpen && (
        <VerticalNavLink asLink href={'/?from=login'} reverse>
          ↑ ABOUT
        </VerticalNavLink>
      )}

      <h1>Sign in</h1>
      <form
        className={isOpen ? 'open' : ''}
        onSubmit={handleSubmit(onLogin)}
        id="loginForm"
      >
        <Input
          {...register('username', {
            required: { value: true, message: 'Username is required' },
          })}
          name="username"
          aria-label="confirm password"
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
          {Object.values(errors).map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
      <div className={styles.actionWrapper}>
        <Link scroll={false} href={'/register'}>
          Sign up instead
        </Link>

        <Button form="loginForm" withArrow={!isLoading} disabled={isLoading}>
          <span>SIGN IN</span>
          {isLoading && <Loading />}
        </Button>
      </div>
    </>
  )
}
