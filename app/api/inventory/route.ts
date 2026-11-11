import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { financialEntries, inventoryItems, inventoryMovements } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const itemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  unit: z.string().trim().min(1).max(24),
  quantity: z.number().nonnegative().max(1_000_000),
  unitCost: z.number().nonnegative().max(100_000_000),
  reorderLevel: z.number().nonnegative().max(1_000_000),
}).strict()

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Kiểm tra lại tên, đơn vị và số lượng.' }, { status: 400 })

  const itemId = randomUUID()
  const userId = session.user.id
  await db.transaction(async (transaction) => {
    await transaction.insert(inventoryItems).values({
      id: itemId,
      userId,
      name: parsed.data.name,
      unit: parsed.data.unit,
      quantity: parsed.data.quantity.toFixed(2),
      unitCost: parsed.data.unitCost.toFixed(2),
      reorderLevel: parsed.data.reorderLevel.toFixed(2),
    })

    if (parsed.data.quantity > 0) {
      await transaction.insert(inventoryMovements).values({
        id: randomUUID(),
        userId,
        itemId,
        movementType: 'stock_in',
        quantity: parsed.data.quantity.toFixed(2),
        unitCost: parsed.data.unitCost.toFixed(2),
        note: 'Số lượng ban đầu',
      })
      if (parsed.data.unitCost > 0) {
        await transaction.insert(financialEntries).values({
          id: randomUUID(),
          userId,
          entryType: 'expense',
          category: 'materials',
          description: `Tồn kho ban đầu: ${parsed.data.name}`,
          amount: (parsed.data.quantity * parsed.data.unitCost).toFixed(2),
          paymentMethod: 'other',
        })
      }
    }
  })

  return NextResponse.json({ id: itemId }, { status: 201 })
}
