import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { financialEntries } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const entrySchema = z.object({
  entryType: z.enum(['income', 'expense']),
  category: z.enum(['sales', 'materials', 'labor', 'packaging', 'operating', 'other']),
  description: z.string().trim().min(2).max(240),
  amount: z.number().positive().max(100_000_000),
  paymentMethod: z.enum(['cash', 'bank', 'other']),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict()

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Kiểm tra lại nội dung và số tiền.' }, { status: 400 })

  await db.insert(financialEntries).values({
    id: randomUUID(),
    userId: session.user.id,
    ...parsed.data,
    amount: parsed.data.amount.toFixed(2),
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
