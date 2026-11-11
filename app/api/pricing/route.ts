import { and, avg, count, countDistinct, eq, inArray, sql } from 'drizzle-orm'
import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { orderRequestItems, orderRequests, products } from '@/lib/db/schema'
import { getSession } from '@/lib/session'

const requestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(['ceramics', 'textiles', 'bamboo', 'lacquer', 'other']),
  materialCost: z.number().nonnegative().max(100_000_000),
  laborCost: z.number().nonnegative().max(100_000_000),
}).strict()

const recommendationSchema = z.object({
  floorPrice: z.number().int().positive(),
  targetPrice: z.number().int().positive(),
  premiumPrice: z.number().int().positive(),
  rationale: z.string().min(1).max(360),
  marketNote: z.string().min(1).max(240),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Kiểm tra lại tên sản phẩm và chi phí.' }, { status: 400 })

  const [supply] = await db.select({
    listingCount: count(),
    averagePrice: avg(products.price),
    medianPrice: sql<string | null>`percentile_cont(0.5) WITHIN GROUP (ORDER BY CAST(${products.price} AS numeric))`,
    views: sql<number>`coalesce(sum(${products.viewCount}), 0)`,
  }).from(products).where(and(eq(products.category, parsed.data.category), eq(products.status, 'published')))

  const [demand] = await db.select({
    orderCount: countDistinct(orderRequests.id),
    acceptedUnits: sql<number>`coalesce(sum(${orderRequestItems.quantity}), 0)`,
  })
    .from(orderRequestItems)
    .innerJoin(orderRequests, and(
      eq(orderRequests.id, orderRequestItems.orderRequestId),
      eq(orderRequests.userId, orderRequestItems.userId),
    ))
    .innerJoin(products, and(
      eq(products.id, orderRequestItems.productId),
      eq(products.userId, orderRequestItems.userId),
    ))
    .where(and(
      eq(products.category, parsed.data.category),
      inArray(orderRequests.status, ['accepted', 'completed']),
    ))

  const materialAndLabor = parsed.data.materialCost + parsed.data.laborCost
  const costFloor = Math.max(1_000, Math.ceil(materialAndLabor * 1.15 / 1_000) * 1_000)
  const market = {
    listingCount: Number(supply?.listingCount ?? 0),
    averagePrice: Number(supply?.averagePrice ?? 0),
    medianPrice: Number(supply?.medianPrice ?? 0),
    views: Number(supply?.views ?? 0),
    acceptedOrders: Number(demand?.orderCount ?? 0),
    acceptedUnits: Number(demand?.acceptedUnits ?? 0),
  }

  try {
    const { output } = await generateText({
      model: 'google/gemini-3.8-flash',
      output: Output.object({ schema: recommendationSchema }),
      prompt: [
        'Bạn là chuyên gia định giá sản phẩm thủ công trên một sàn cộng đồng Việt Nam.',
        'Chỉ sử dụng số liệu marketplace được cung cấp; không tuyên bố đã khảo sát website bên ngoài và không tự bịa số liệu thị trường.',
        'Tính đến chi phí vật liệu và công lao động. Giá sàn phải cao hơn tổng chi phí. Mức đề xuất phải hợp lý so với giá trung vị của cùng danh mục nếu đã có đủ sản phẩm so sánh.',
        'Nếu có dưới 3 sản phẩm so sánh hoặc chưa có đơn được người bán chấp nhận, phải nói rõ dữ liệu còn hạn chế và dựa chủ yếu vào chi phí.',
        'Đưa ra giá bằng số nguyên VNĐ, làm tròn đến nghìn đồng. Giữ giá trong khoảng 1.000 đến 100.000.000 VNĐ.',
        `Tác phẩm: ${parsed.data.name}`,
        `Danh mục: ${parsed.data.category}`,
        `Chi phí vật liệu: ${parsed.data.materialCost} VNĐ`,
        `Chi phí lao động: ${parsed.data.laborCost} VNĐ`,
        `Số sản phẩm đang đăng cùng danh mục: ${market.listingCount}`,
        `Giá trung bình cùng danh mục: ${market.averagePrice} VNĐ`,
        `Giá trung vị cùng danh mục: ${market.medianPrice} VNĐ`,
        `Lượt xem ghi nhận: ${market.views}`,
        `Đơn được người bán chấp nhận hoặc hoàn tất: ${market.acceptedOrders}`,
        `Sản phẩm trong các đơn đó: ${market.acceptedUnits}`,
        'Trả về giá sàn, giá đề xuất, giá cao cấp, một lý do ngắn và ghi chú về độ tin cậy của dữ liệu.',
      ].join('\n'),
    })

    const floorPrice = Math.min(100_000_000, Math.max(costFloor, Math.ceil(output.floorPrice / 1_000) * 1_000))
    const targetPrice = Math.min(100_000_000, Math.max(floorPrice, Math.ceil(output.targetPrice / 1_000) * 1_000))
    const premiumPrice = Math.min(100_000_000, Math.max(targetPrice, Math.ceil(output.premiumPrice / 1_000) * 1_000))

    return NextResponse.json({
      floorPrice,
      targetPrice,
      premiumPrice,
      rationale: output.rationale,
      marketNote: output.marketNote,
      market,
      confidence: market.listingCount >= 3 ? 'Dữ liệu nội bộ tham khảo' : 'Dữ liệu còn hạn chế',
    })
  } catch {
    return NextResponse.json({ error: 'Chưa thể tạo gợi ý giá. Vui lòng thử lại sau.' }, { status: 503 })
  }
}
