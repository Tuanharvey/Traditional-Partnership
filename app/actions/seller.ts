'use server'

import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { sellerProfiles } from '@/lib/db/schema'
import { requireUserId } from '@/lib/session'

const sellerProfileSchema = z.object({
  shopName: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(500).default(''),
  contactPhone: z.string().trim().max(32).default(''),
})

export async function saveSellerProfile(formData: FormData) {
  const userId = await requireUserId()
  const parsed = sellerProfileSchema.safeParse({
    shopName: formData.get('shopName'),
    bio: formData.get('bio') ?? '',
    contactPhone: formData.get('contactPhone') ?? '',
  })

  if (!parsed.success) redirect('/seller/onboarding?issue=invalid')

  const [existing] = await db.select({ id: sellerProfiles.id }).from(sellerProfiles).where(eq(sellerProfiles.userId, userId)).limit(1)

  if (existing) {
    await db.update(sellerProfiles).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(sellerProfiles.id, existing.id), eq(sellerProfiles.userId, userId)))
  } else {
    await db.insert(sellerProfiles).values({ id: randomUUID(), userId, ...parsed.data })
  }

  redirect('/seller/dashboard')
}
