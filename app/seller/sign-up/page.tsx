import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Tạo tài khoản người bán' }

export default async function SellerSignUpPage() {
  const session = await getSession()
  if (session?.user) redirect('/seller/dashboard')
  return <AuthForm mode="sign-up" />
}
