import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireUserId() {
  const session = await getSession()
  if (!session?.user) redirect('/seller/sign-in')
  return session.user.id
}
