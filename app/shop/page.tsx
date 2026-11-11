import type { Metadata } from 'next'
import { ShopCatalog } from '@/components/shop-catalog'
import { getPublicProducts } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Cửa hàng thủ công Việt',
  description: 'Khám phá những tác phẩm thủ công được giới thiệu bởi các nghệ nhân và xưởng làng nghề.',
}
export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const products = await getPublicProducts()

  return (
    <main className="shop-page">
      <section className="shop-intro">
        <p className="eyebrow">GIAN HÀNG CỘNG ĐỒNG</p>
        <h1>Mỗi tác phẩm<br />mang một câu chuyện.</h1>
        <p>Khám phá những món đồ thủ công được làm nên bằng kỹ nghệ, thời gian và sự tận tâm.</p>
      </section>
      <ShopCatalog products={products} />
    </main>
  )
}
