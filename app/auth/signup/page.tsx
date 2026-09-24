import type { Metadata } from 'next'

import { SignupForm } from '@/app/auth/signup/signup-form'
import { AuthShell } from '@/app/auth/auth-shell'
import { COMPANY_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Create an account · ${COMPANY_NAME}`,
  description: 'Join Coder’s Shop to buy, sell, and discover gadgets from the community.',
}

export default function SignupPage() {
  return (
    <AuthShell
      image='/signup.jpg'
      imageAlt="Gadgets and electronics available on Coder's Shop"
      headline='Buy, sell, and upgrade your setup.'
      points={['List a gadget in under a minute', 'Reach buyers in your city', 'No listing fees, ever']}
    >
      <SignupForm />
    </AuthShell>
  )
}
