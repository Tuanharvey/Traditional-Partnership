import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(''),
  category: z.enum(['ceramics', 'textiles', 'bamboo', 'lacquer', 'other']),
  price: z.number().positive().max(100_000_000),
  materialCost: z.number().nonnegative().max(100_000_000),
  laborCost: z.number().nonnegative().max(100_000_000),
  stockQuantity: z.number().int().min(0).max(10_000),
  imageUrls: z.array(z.string().url()).max(6),
  status: z.enum(['draft', 'published']),
}).strict()

function isHostedProductImage(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Kiểm tra lại thông tin sản phẩm.' }, { status: 400 })

  if (parsed.data.imageUrls.some((url) => !isHostedProductImage(url))) {
    return NextResponse.json({ error: 'Ảnh cần được tải lên từ biểu mẫu sản phẩm.' }, { status: 400 })
  }
  if (parsed.data.status === 'published' && (!parsed.data.imageUrls.length || parsed.data.stockQuantity < 1)) {
    return NextResponse.json({ error: 'Sản phẩm cần có ít nhất một ảnh và còn hàng để đăng bán.' }, { status: 400 })
  }

  try {
    const [product] = await db.insert(products).values({
      id: randomUUID(),
      userId: session.user.id,
      ...parsed.data,
      price: parsed.data.price.toFixed(2),
      materialCost: parsed.data.materialCost.toFixed(2),
      laborCost: parsed.data.laborCost.toFixed(2),
    }).returning({ id: products.id })

    return NextResponse.json({ id: product.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Chưa thể lưu sản phẩm. Vui lòng thử lại.' }, { status: 500 })
  }
}
