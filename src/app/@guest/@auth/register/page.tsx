'use client'
import { useForm, SubmitHandler } from 'react-hook-form'
import { usePathname, useRouter } from 'next/navigation'
import { register as registerAction } from '@/app/actions/register'
import Input from '@/components/Input'
import VerticalNavLink from '@/components/VerticalNavigationButton'
import Link from 'next/link'
import Button from '@/components/Button'
import Loading from '@/components/Loading'
import styles from '../auth.module.scss'

interface Inputs {
  username: string
  password: string
  'confirm-password': string
}

export default function RegisterPage() {
  const pathname = usePathname()
  const isOpen = pathname.includes('/register')
  const router = useRouter()

  const {
    register,
    watch,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: isLoading },
  } = useForm<Inputs>()

  const onRegister: SubmitHandler<Inputs> = async (data, event) => {
    event?.preventDefault()
    const res = await registerAction(data, false)
    if (!res.success) {
      setError('username', {
        type: 'server_error',
        message: res.errorMessage,
      })

      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {isOpen && (
        <VerticalNavLink asLink href={'/?from=register'} reverse>
          ↑ ABOUT
        </VerticalNavLink>
      )}

      <h1>Sign up</h1>
      <form
        className={isOpen ? 'open' : ''}
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
          aria-label="password"
          name="password"
          placeholder="Password"
          type="password"
        />
        <Input
          {...register('confirm-password', {
            required: { value: true, message: 'Confirm Password is required' },
            validate: {
              value: (value) =>
                value === watch('password') || 'Passwords do not match',
            },
          })}
          aria-label="confirm password"
          name="confirm-password"
          placeholder="Confirm Password"
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
        <Link scroll={false} href={'/login'}>
          Sign in instead
        </Link>
        <Button form="loginForm" withArrow={!isLoading} disabled={isLoading}>
          SIGN UP
          {isLoading && <Loading />}
        </Button>
      </div>
    </>
  )
}
