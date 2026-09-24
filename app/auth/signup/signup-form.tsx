'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
// standardSchemaResolver (not zodResolver): @hookform/resolvers@5.4 resolves zod 3
// internally, so its /zod entry's types clash with the app's zod 4. Zod 4 implements
// Standard Schema natively, so this path is version-agnostic.
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { CircleAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useSignUp } from '@/hooks/use-auth'
import { ApiError } from '@/lib/api/client'
import { signUpSchema, type SignUpValues } from '@/lib/validations/auth'
import { PasswordInput } from '../password-input'

export function SignupForm() {
  const router = useRouter()
  const signUp = useSignUp()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: standardSchemaResolver(signUpSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  // The mutation creates the account and signs into it, so a successful submit
  // lands on the home page already authenticated.
  const onSubmit = async (values: SignUpValues) => {
    try {
      await signUp.mutateAsync({ name: values.name, email: values.email, password: values.password })
      router.push('/')
      router.refresh()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError('root', { message: 'Something went wrong. Please try again.' })
        return
      }

      if (error.status === 409) {
        setError('email', { message: 'That email is already registered. Try signing in instead.' })
        return
      }

      if (error.status === 422 && error.field) {
        setError(error.field as keyof SignUpValues, { message: error.message })
        return
      }

      setError('root', { message: error.message })
    }
  }

  const isBusy = isSubmitting || signUp.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className='flex flex-col gap-2'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight'>Create your account</h1>
          <p className='text-muted-foreground text-sm'>Start buying and selling gadgets in minutes.</p>
        </div>

        {errors.root && (
          <div
            role='alert'
            className='border-destructive/40 bg-destructive/5 flex items-start gap-3 rounded-2xl border p-4'
          >
            <CircleAlert className='text-destructive mt-0.5 size-4 shrink-0' />
            <p className='text-sm'>{errors.root.message}</p>
          </div>
        )}

        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor='name'>Full name</FieldLabel>
          <Input
            id='name'
            autoComplete='name'
            placeholder='Ada Lovelace'
            aria-invalid={Boolean(errors.name)}
            className='h-10'
            {...register('name')}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='yourname@email.com'
            aria-invalid={Boolean(errors.email)}
            className='h-10'
            {...register('email')}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <div className='grid gap-6 sm:grid-cols-2'>
          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <PasswordInput
              id='password'
              autoComplete='new-password'
              placeholder='••••••••'
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>

          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor='confirmPassword'>Confirm password</FieldLabel>
            <PasswordInput
              id='confirmPassword'
              autoComplete='new-password'
              placeholder='••••••••'
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
          </Field>
        </div>

        <FieldDescription className='-mt-3'>Use at least 8 characters.</FieldDescription>

        <Field>
          <Button type='submit' size='lg' disabled={isBusy} className='h-11 w-full rounded-full'>
            {isBusy && <Loader2 className='size-4 animate-spin' />}
            {isBusy ? 'Creating account…' : 'Create account'}
          </Button>
        </Field>

        <FieldDescription className='text-center'>
          Already have an account? <Link href='/auth/signin'>Sign in</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
