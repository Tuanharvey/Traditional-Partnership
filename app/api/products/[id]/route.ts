import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const statusSchema = z.object({ status: z.enum(['draft', 'published', 'archived']) }).strict()

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Trạng thái chưa hợp lệ.' }, { status: 400 })

  const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.userId, session.user.id))).limit(1)
  if (!product) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 })
  if (parsed.data.status === 'published' && (!product.imageUrls.length || product.stockQuantity < 1)) {
    return NextResponse.json({ error: 'Hãy thêm ảnh và cập nhật số lượng tồn trước khi đăng bán.' }, { status: 400 })
  }

  await db.update(products)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
