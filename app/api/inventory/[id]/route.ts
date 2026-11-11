import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { financialEntries, inventoryItems, inventoryMovements } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const movementSchema = z.object({
  movementType: z.enum(['stock_in', 'stock_out']),
  quantity: z.number().positive().max(1_000_000),
  unitCost: z.number().nonnegative().max(100_000_000),
  note: z.string().trim().max(240).default(''),
}).strict()

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = movementSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Kiểm tra lại số lượng nhập hoặc xuất.' }, { status: 400 })

  const [item] = await db.select().from(inventoryItems).where(and(
    eq(inventoryItems.id, id),
    eq(inventoryItems.userId, session.user.id),
  )).limit(1)
  if (!item) return NextResponse.json({ error: 'Không tìm thấy mặt hàng trong kho.' }, { status: 404 })

  const currentQuantity = Number(item.quantity)
  if (parsed.data.movementType === 'stock_out' && parsed.data.quantity > currentQuantity) {
    return NextResponse.json({ error: 'Số lượng xuất vượt quá tồn kho.' }, { status: 409 })
  }

  const nextQuantity = parsed.data.movementType === 'stock_in'
    ? currentQuantity + parsed.data.quantity
    : currentQuantity - parsed.data.quantity
  const previousValue = currentQuantity * Number(item.unitCost)
  const movementValue = parsed.data.quantity * parsed.data.unitCost
  const nextUnitCost = parsed.data.movementType === 'stock_in' && nextQuantity > 0
    ? (previousValue + movementValue) / nextQuantity
    : Number(item.unitCost)

  try {
    await db.transaction(async (transaction) => {
      const [changed] = await transaction.update(inventoryItems)
        .set({ quantity: nextQuantity.toFixed(2), unitCost: nextUnitCost.toFixed(2), updatedAt: new Date() })
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, session.user.id), eq(inventoryItems.quantity, item.quantity)))
        .returning({ id: inventoryItems.id })

      if (!changed) throw new Error('INVENTORY_CHANGED')

      await transaction.insert(inventoryMovements).values({
        id: randomUUID(),
        userId: session.user.id,
        itemId: id,
        movementType: parsed.data.movementType,
        quantity: parsed.data.quantity.toFixed(2),
        unitCost: parsed.data.unitCost.toFixed(2),
        note: parsed.data.note,
      })

      if (parsed.data.movementType === 'stock_in' && movementValue > 0) {
        await transaction.insert(financialEntries).values({
          id: randomUUID(),
          userId: session.user.id,
          entryType: 'expense',
          category: 'materials',
          description: parsed.data.note || `Nhập kho: ${item.name}`,
          amount: movementValue.toFixed(2),
          paymentMethod: 'other',
        })
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVENTORY_CHANGED') {
      return NextResponse.json({ error: 'Tồn kho vừa thay đổi. Tải lại danh sách rồi thử lại.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Chưa thể cập nhật tồn kho. Vui lòng thử lại.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
