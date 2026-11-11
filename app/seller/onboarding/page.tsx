import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { db } from '@/lib/db'
import { sellerProfiles } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Thiết lập gian hàng' }
export const dynamic = 'force-dynamic'

type OnboardingPageProps = {
  searchParams: Promise<{ issue?: string }>
}

export default async function SellerOnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await getSession()
  if (!session?.user) redirect('/seller/sign-in')

  const [profile] = await db
    .select({ id: sellerProfiles.id })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, session.user.id))
    .limit(1)

  if (profile) redirect('/seller/dashboard')

  const params = await searchParams
  return <OnboardingForm issue={params.issue} />
}
