import { useState } from 'react'
import Input from '../Input'
import { SubmitHandler, useForm } from 'react-hook-form'
import Button from '../Button'
import styles from './passwordPrompt.module.scss'

interface PasswordPromptProps {
  onSubmit: (password: string, withCreateID?: boolean) => void | Promise<void>
  promptLabel: string | React.ReactNode
  withConfirmation?: boolean
  username: string
}

type Inputs<T> = T extends true
  ? {
      password: string
      'confirm-password': string
    }
  : {
      password: string
    }

const PasswordPrompt = ({
  onSubmit,
  promptLabel,
  withConfirmation = false,
  username,
}: PasswordPromptProps) => {
  const [password, setPassword] = useState('')
  const {
    register,
    watch,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Inputs<typeof withConfirmation>>()

  const onFormSubmit: SubmitHandler<Inputs<typeof withConfirmation>> = async (
    data,
    event
  ) => {
    event?.preventDefault()
    try {
      await onSubmit(data.password, withConfirmation)
    } catch (error) {
      if (error instanceof Error) {
        setError('password', {
          type: 'manual',
          message: error.message,
        })
      }
      console.error(error)
    }
  }

  return (
    <main className={styles.container}>
      <label>{promptLabel}</label>

      <form onSubmit={handleSubmit(onFormSubmit)} id="passwordPromptForm">
        <input
          style={{ display: 'none' }}
          autoComplete="username"
          readOnly
          name="username"
          id="username"
          aria-hidden="true"
          aria-label="prefilled username"
          value={`${username}-db`}
        />
        <Input
          color="secondary"
          type="password"
          aria-label="password"
          placeholder="Password"
          {...register('password', {
            required: {
              value: true,
              message: 'Password is required',
            },
            ...(withConfirmation && {
              minLength: {
                value: 4,
                message: 'Password must be at least 8 characters',
              },
              maxLength: {
                value: 32,
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
            }),
          })}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
          }}
        />
        {withConfirmation && (
          <Input
            placeholder="Confirm Password"
            aria-label="confirm password"
            color="secondary"
            {...register('confirm-password', {
              required: {
                value: true,
                message: 'Confirm Password is required',
              },
              validate: {
                value: (value) =>
                  value === watch('password') || 'Passwords do not match',
              },
            })}
            type="password"
            id="confirm-password"
          />
        )}

        <Button form="passwordPromptForm" color="secondary">
          Submit
        </Button>
      </form>
      {Object.values(errors).length > 0 && (
        <div className={styles.errorWrapper}>
          {Object.values(errors).map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
    </main>
  )
}

export default PasswordPrompt
