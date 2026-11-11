import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { orderRequestItems, orderRequests, products } from '@/lib/db/schema'

const orderSchema = z.object({
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email().max(254),
  buyerPhone: z.string().trim().min(8).max(32),
  note: z.string().trim().max(500).default(''),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
  }).strict()).min(1).max(10),
}).strict()

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Kiểm tra lại thông tin đặt hàng.' }, { status: 400 })

  const mergedItems = new Map<string, number>()
  for (const item of parsed.data.items) {
    const quantity = (mergedItems.get(item.productId) ?? 0) + item.quantity
    if (quantity > 10) return NextResponse.json({ error: 'Số lượng tối đa cho mỗi sản phẩm là 10.' }, { status: 400 })
    mergedItems.set(item.productId, quantity)
  }
  const requestedItems = [...mergedItems].map(([productId, quantity]) => ({ productId, quantity }))
  if (requestedItems.reduce((total, item) => total + item.quantity, 0) > 25) {
    return NextResponse.json({ error: 'Giỏ hàng tối đa 25 sản phẩm.' }, { status: 400 })
  }

  const listedProducts = await db.select().from(products).where(and(
    inArray(products.id, requestedItems.map((item) => item.productId)),
    eq(products.status, 'published'),
  ))
  if (listedProducts.length !== requestedItems.length) {
    return NextResponse.json({ error: 'Một số sản phẩm không còn khả dụng.' }, { status: 400 })
  }

  const productById = new Map(listedProducts.map((product) => [product.id, product]))
  const hasInsufficientStock = requestedItems.some((item) => productById.get(item.productId)!.stockQuantity < item.quantity)
  if (hasInsufficientStock) {
    return NextResponse.json({ error: 'Số lượng còn lại đã thay đổi. Cập nhật giỏ hàng rồi thử lại.' }, { status: 409 })
  }

  const lines = requestedItems.map((item) => {
    const product = productById.get(item.productId)!
    return {
      product,
      quantity: item.quantity,
      unitPrice: Number(product.price),
      lineTotal: Number(product.price) * item.quantity,
    }
  })
  const totalAmount = lines.reduce((total, line) => total + line.lineTotal, 0)
  if (!Number.isFinite(totalAmount) || totalAmount <= 0 || totalAmount > 100_000_000) {
    return NextResponse.json({ error: 'Giá trị đơn hàng chưa hợp lệ.' }, { status: 400 })
  }

  const grouped = new Map<string, typeof lines>()
  for (const line of lines) grouped.set(line.product.userId, [...(grouped.get(line.product.userId) ?? []), line])

  try {
    const requestIds = await db.transaction(async (transaction) => {
      const createdIds: string[] = []
      for (const [sellerId, sellerLines] of grouped) {
        const orderId = randomUUID()
        const sellerTotal = sellerLines.reduce((total, line) => total + line.lineTotal, 0)
        await transaction.insert(orderRequests).values({
          id: orderId,
          userId: sellerId,
          buyerName: parsed.data.buyerName,
          buyerEmail: parsed.data.buyerEmail,
          buyerPhone: parsed.data.buyerPhone,
          note: parsed.data.note,
          totalAmount: sellerTotal.toFixed(2),
        })
        await transaction.insert(orderRequestItems).values(sellerLines.map((line) => ({
          id: randomUUID(),
          userId: sellerId,
          orderRequestId: orderId,
          productId: line.product.id,
          productName: line.product.name,
          unitPrice: line.unitPrice.toFixed(2),
          quantity: line.quantity,
          lineTotal: line.lineTotal.toFixed(2),
        })))
        createdIds.push(orderId)
      }
      return createdIds
    })

    return NextResponse.json({ success: true, orderCount: requestIds.length }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Số lượng còn lại đã thay đổi. Cập nhật giỏ hàng rồi thử lại.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Chưa thể ghi nhận yêu cầu. Vui lòng thử lại.' }, { status: 500 })
  }
}
