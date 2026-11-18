import { notFound } from 'next/navigation'
import { SellerWorkspace } from '@/components/seller-workspace'

export default function SellerFormPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  return (
    <main className="seller-page">
      <div className="seller-page-heading">
        <div>
          <p className="eyebrow">GIAO DIỆN XEM TRƯỚC</p>
          <h1>Quản lý xưởng</h1>
          <p>Dữ liệu sản phẩm, tài chính và vật tư đều để trống.</p>
        </div>
      </div>
      <SellerWorkspace
        products={[]}
        orders={[]}
        financialEntries={[]}
        inventoryItems={[]}
        inventoryMovements={[]}
        reports={{ weeklyIncome: 0, weeklyExpenses: 0, monthlyIncome: 0, monthlyExpenses: 0 }}
      />
    </main>
  )
}
