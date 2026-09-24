import type { Metadata } from 'next'

import { LoginForm } from '@/app/auth/signin/signin-form'
import { AuthShell } from '@/app/auth/auth-shell'
import { COMPANY_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Sign in · ${COMPANY_NAME}`,
  description: 'Sign in to your Coder’s Shop account to manage your listings and messages.',
}

export default function LoginPage() {
  return (
    <AuthShell
      image='/signin.jpg'
      imageAlt="Desk setup with gadgets listed on Coder's Shop"
      headline='Welcome back to the community marketplace.'
      points={['Track every listing you post', 'Message buyers and sellers directly', 'Save the gadgets you love']}
    >
      <LoginForm />
    </AuthShell>
  )
}
