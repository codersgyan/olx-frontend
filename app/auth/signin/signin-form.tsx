'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
// standardSchemaResolver (not zodResolver): @hookform/resolvers@5.4 resolves zod 3
// internally, so its /zod entry's types clash with the app's zod 4. Zod 4 implements
// Standard Schema natively, so this path is version-agnostic.
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { CircleAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useSignIn } from '@/hooks/use-auth'
import { ApiError } from '@/lib/api/client'
import { signInSchema, type SignInValues } from '@/lib/validations/auth'
import { PasswordInput } from '../password-input'

export function LoginForm() {
  const router = useRouter()
  const signIn = useSignIn()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: standardSchemaResolver(signInSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const onSubmit = async (values: SignInValues) => {
    try {
      await signIn.mutateAsync({ email: values.email, password: values.password })
      router.push('/')
      router.refresh()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError('root', { message: 'Something went wrong. Please try again.' })
        return
      }

      // 422 names the offending field; anything else is a form-level failure.
      // The API deliberately answers "email or password don't match" for both a
      // wrong password and an unknown email, so this must not be shown against
      // the email field — that would leak which accounts exist.
      if (error.status === 422 && error.field) {
        setError(error.field as keyof SignInValues, { message: error.message })
        return
      }

      setError('root', { message: error.message })
    }
  }

  const isBusy = isSubmitting || signIn.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className='flex flex-col gap-2'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight'>Welcome back</h1>
          <p className='text-muted-foreground text-sm'>Sign in to manage your listings and messages.</p>
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

        <Field data-invalid={Boolean(errors.password)}>
          <div className='flex items-center'>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
            <Link
              href='/auth/signin'
              className='text-muted-foreground hover:text-foreground ml-auto text-sm underline-offset-4 transition-colors hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id='password'
            autoComplete='current-password'
            placeholder='••••••••'
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <FieldError errors={errors.password ? [errors.password] : undefined} />
        </Field>

        {/* The API mints a fixed 24h token with no "remember me" concept, so this
            only controls whether the session survives closing the tab. Saying
            "30 days" would be a promise the backend does not keep. */}
        <Field orientation='horizontal'>
          <Controller
            control={control}
            name='rememberMe'
            render={({ field }) => (
              <Checkbox
                id='rememberMe'
                checked={Boolean(field.value)}
                onCheckedChange={checked => field.onChange(checked === true)}
              />
            )}
          />
          <FieldLabel htmlFor='rememberMe' className='text-sm font-normal'>
            Keep me signed in
          </FieldLabel>
        </Field>

        <Field>
          <Button type='submit' size='lg' disabled={isBusy} className='h-11 w-full rounded-full'>
            {isBusy && <Loader2 className='size-4 animate-spin' />}
            {isBusy ? 'Signing in…' : 'Sign in'}
          </Button>
        </Field>

        <FieldDescription className='text-center'>
          Don&apos;t have an account? <Link href='/auth/signup'>Sign up</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
