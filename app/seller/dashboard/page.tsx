import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SellerWorkspace } from '@/components/seller-workspace'
import { getSellerDashboardData } from '@/lib/data'
import { requireUserId } from '@/lib/session'

export const metadata: Metadata = { title: 'Không gian người bán' }
export const dynamic = 'force-dynamic'

export default async function SellerDashboardPage() {
  const userId = await requireUserId()
  const data = await getSellerDashboardData(userId)
  if (!data) redirect('/seller/onboarding')

  return (
    <main className="seller-page">
      <div className="seller-page-heading">
        <div>
          <p className="eyebrow">KHÔNG GIAN NGƯỜI BÁN</p>
          <h1>Chào mừng, {data.seller.shopName}</h1>
          <p>Quản lý gian hàng, tác phẩm và yêu cầu đặt hàng tại một nơi.</p>
        </div>
        <span className="seller-status"><span aria-hidden="true" /> Gian hàng đang hoạt động</span>
      </div>
      <SellerWorkspace
        products={data.products}
        orders={data.orders}
        financialEntries={data.financialEntries}
        inventoryItems={data.inventoryItems}
        inventoryMovements={data.inventoryMovements}
        reports={data.reports}
      />
    </main>
  )
}
