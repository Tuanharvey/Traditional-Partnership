import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function SellerEntryPage() {
  const session = await getSession()
  redirect(session?.user ? '/seller/dashboard' : '/seller/sign-in')
}
