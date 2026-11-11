import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { financialEntries, orderRequests } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const statusSchema = z.object({ status: z.enum(['accepted', 'completed', 'cancelled']) }).strict()
type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Trạng thái đơn chưa hợp lệ.' }, { status: 400 })

  const [order] = await db.select().from(orderRequests).where(and(
    eq(orderRequests.id, id),
    eq(orderRequests.userId, session.user.id),
  )).limit(1)
  if (!order) return NextResponse.json({ error: 'Không tìm thấy yêu cầu đặt hàng.' }, { status: 404 })

  const allowed = order.status === 'new'
    ? ['accepted', 'cancelled']
    : order.status === 'accepted'
      ? ['completed', 'cancelled']
      : []
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json({ error: 'Không thể chuyển đơn sang trạng thái này.' }, { status: 409 })
  }

  const updated = await db.transaction(async (transaction) => {
    const [changedOrder] = await transaction.update(orderRequests)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(and(
        eq(orderRequests.id, id),
        eq(orderRequests.userId, session.user.id),
        eq(orderRequests.status, order.status),
      ))
      .returning({ id: orderRequests.id })

    if (!changedOrder) return false

    if (parsed.data.status === 'completed') {
      await transaction.insert(financialEntries).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        entryType: 'income',
        category: 'sales',
        description: `Đơn hàng ${id.slice(0, 8)}`,
        amount: Number(order.totalAmount).toFixed(2),
        paymentMethod: 'other',
        sourceOrderId: id,
      }).onConflictDoNothing({ target: financialEntries.sourceOrderId })
    }

    return true
  })

  if (!updated) return NextResponse.json({ error: 'Đơn hàng vừa được cập nhật. Tải lại trang rồi thử lại.' }, { status: 409 })
  return NextResponse.json({ success: true })
}
