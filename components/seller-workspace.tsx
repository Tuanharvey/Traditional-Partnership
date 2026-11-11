'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'

type SellerProduct = {
  id: string
  name: string
  description: string
  category: string
  price: number
  materialCost: number
  laborCost: number
  stockQuantity: number
  imageUrls: string[]
  status: string
}

type SellerOrderItem = {
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

type SellerOrder = {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  note: string
  totalAmount: number
  status: string
  createdAt: Date
  items: SellerOrderItem[]
}

type FinancialEntry = {
  id: string
  entryType: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  entryDate: string
}

type InventoryItem = {
  id: string
  name: string
  unit: string
  quantity: number
  unitCost: number
  reorderLevel: number
}

type InventoryMovement = {
  id: string
  itemName: string
  movementType: string
  quantity: number
  unitCost: number
  note: string
  occurredAt: Date
}

type SellerWorkspaceProps = {
  products: SellerProduct[]
  orders: SellerOrder[]
  financialEntries: FinancialEntry[]
  inventoryItems: InventoryItem[]
  inventoryMovements: InventoryMovement[]
  reports: { weeklyIncome: number; weeklyExpenses: number; monthlyIncome: number; monthlyExpenses: number }
}

const categoryLabels: Record<string, string> = {
  ceramics: 'Gốm sứ',
  textiles: 'Dệt may',
  bamboo: 'Mây tre',
  lacquer: 'Sơn mài',
  other: 'Khác',
}

const financeCategoryLabels: Record<string, string> = {
  sales: 'Doanh thu',
  materials: 'Nguyên vật liệu',
  labor: 'Nhân công',
  packaging: 'Bao bì',
  operating: 'Vận hành xưởng',
  other: 'Khác',
}

const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  published: 'Đang đăng bán',
  archived: 'Đã lưu trữ',
  new: 'Mới nhận',
  accepted: 'Đã xác nhận',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function SellerWorkspace({ products, orders, financialEntries, inventoryItems, inventoryMovements, reports }: SellerWorkspaceProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'orders' | 'finance' | 'inventory' | 'pricing'>('overview')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('ceramics')
  const [materialCost, setMaterialCost] = useState('')
  const [laborCost, setLaborCost] = useState('')
  const [price, setPrice] = useState('')
  const [pricingName, setPricingName] = useState('')
  const [pricingCategory, setPricingCategory] = useState('ceramics')
  const [pricingMaterial, setPricingMaterial] = useState('')
  const [pricingLabor, setPricingLabor] = useState('')
  const [recommendation, setRecommendation] = useState<null | {
    floorPrice: number
    targetPrice: number
    premiumPrice: number
    rationale: string
    marketNote: string
    market: { listingCount: number; acceptedOrders: number; acceptedUnits: number }
    confidence: string
  }>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [movementQuantity, setMovementQuantity] = useState<Record<string, string>>({})
  const [movementUnitCost, setMovementUnitCost] = useState<Record<string, string>>({})
  const [movementNote, setMovementNote] = useState<Record<string, string>>({})

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [imageFiles])

  const publishedCount = products.filter((product) => product.status === 'published').length
  const newOrderCount = orders.filter((order) => order.status === 'new').length

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 6) {
      setNotice('Bạn có thể chọn tối đa 6 ảnh cho một sản phẩm.')
      setImageFiles(files.slice(0, 6))
      return
    }
    setNotice('')
    setImageFiles(files)
  }

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setPending(true)
    const form = event.currentTarget

    try {
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const data = new FormData()
        data.set('file', file)
        const upload = await fetch('/api/uploads', { method: 'POST', body: data })
        const uploaded = await upload.json()
        if (!upload.ok) throw new Error(uploaded.error ?? 'Chưa thể tải ảnh lên.')
        imageUrls.push(uploaded.url)
      }

      const formData = new FormData(form)
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: formData.get('description'),
          category,
          price: Number(price),
          materialCost: Number(materialCost),
          laborCost: Number(laborCost),
          stockQuantity: Number(formData.get('stockQuantity')),
          imageUrls,
          status: formData.get('status'),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Chưa thể lưu sản phẩm.')

      form.reset()
      setName('')
      setMaterialCost('')
      setLaborCost('')
      setPrice('')
      setImageFiles([])
      setNotice('Đã lưu sản phẩm vào gian hàng.')
      setActiveSection('products')
      router.refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  async function getPriceRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setPending(true)
    setRecommendation(null)
    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pricingName,
          category: pricingCategory,
          materialCost: Number(pricingMaterial),
          laborCost: Number(pricingLabor),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Chưa thể tạo gợi ý giá.')
      setRecommendation(result)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  async function updateProductStatus(productId: string, status: string) {
    setNotice('')
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await response.json()
    setNotice(response.ok ? 'Đã cập nhật trạng thái sản phẩm.' : result.error ?? 'Chưa thể cập nhật.')
    if (response.ok) router.refresh()
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setNotice('')
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await response.json()
    setNotice(response.ok ? 'Đã cập nhật yêu cầu đặt hàng.' : result.error ?? 'Chưa thể cập nhật.')
    if (response.ok) router.refresh()
  }

  async function handleFinanceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setPending(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryType: formData.get('entryType'),
          category: formData.get('category'),
          description: formData.get('description'),
          amount: Number(formData.get('amount')),
          paymentMethod: formData.get('paymentMethod'),
          entryDate: formData.get('entryDate'),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Chưa thể lưu bút toán.')
      form.reset()
      setNotice('Đã ghi nhận bút toán tài chính.')
      router.refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  async function handleInventorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setPending(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          unit: formData.get('unit'),
          quantity: Number(formData.get('quantity')),
          unitCost: Number(formData.get('unitCost')),
          reorderLevel: Number(formData.get('reorderLevel')),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Chưa thể lưu vật tư.')
      form.reset()
      setNotice('Đã thêm vật tư vào sổ kho.')
      router.refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  async function recordInventoryMovement(itemId: string, movementType: 'stock_in' | 'stock_out') {
    setNotice('')
    setPending(true)
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movementType,
          quantity: Number(movementQuantity[itemId]),
          unitCost: Number(movementUnitCost[itemId] ?? 0),
          note: movementNote[itemId] ?? '',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Chưa thể cập nhật tồn kho.')
      setNotice(movementType === 'stock_in' ? 'Đã ghi nhận phiếu nhập kho.' : 'Đã ghi nhận phiếu xuất kho.')
      router.refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="seller-workspace">
      <div className="workspace-topbar">
        <nav className="workspace-nav" aria-label="Quản lý gian hàng">
          {([
            ['overview', 'Tổng quan'],
            ['products', 'Sản phẩm'],
            ['orders', `Đơn đặt hàng${newOrderCount ? ` · ${newOrderCount}` : ''}`],
            ['finance', 'Thu chi'],
            ['inventory', 'Kho vật tư'],
            ['pricing', 'Gợi ý định giá'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className={activeSection === id ? 'workspace-tab active' : 'workspace-tab'} aria-pressed={activeSection === id} onClick={() => setActiveSection(id)}>{label}</button>
          ))}
        </nav>
        <div className="workspace-top-actions"><Link className="text-link" href="/shop">Xem gian hàng <span aria-hidden="true">↗</span></Link><SignOutButton /></div>
      </div>

      {notice ? <p className="notice" role="status">{notice}</p> : null}

      {activeSection === 'overview' ? (
        <section className="workspace-panel" aria-labelledby="workspace-overview-title">
          <div className="panel-heading">
            <div><p className="eyebrow">BẮT ĐẦU TỪ ĐÂY</p><h2 id="workspace-overview-title">Một vài bước để mở gian hàng</h2></div>
            <button className="button button-primary" type="button" onClick={() => setActiveSection('products')}>Thêm sản phẩm</button>
          </div>
          <ol className="guide-steps">
            <li><span>01</span><div><strong>Chia sẻ câu chuyện xưởng</strong><p>Hoàn thiện tên gian hàng và phần giới thiệu để khách biết ai là người làm nên tác phẩm.</p></div></li>
            <li><span>02</span><div><strong>Thêm ảnh và mô tả sản phẩm</strong><p>Chụp sản phẩm dưới ánh sáng tự nhiên, mô tả chất liệu, kích thước và kỹ thuật chế tác.</p></div></li>
            <li><span>03</span><div><strong>Ghi chi phí và quản lý vật tư</strong><p>Nhập chi phí vật liệu, công lao động và tồn kho; các lần nhập kho cũng được ghi vào sổ chi phí.</p></div></li>
            <li><span>04</span><div><strong>Theo dõi thu chi</strong><p>Ghi nhận doanh thu, chi phí xưởng và xem tổng hợp theo tuần hoặc tháng.</p></div></li>
            <li><span>05</span><div><strong>Đăng bán và phản hồi yêu cầu</strong><p>Khi khách gửi yêu cầu đặt hàng, xác nhận trực tiếp phương thức thanh toán và giao nhận.</p></div></li>
          </ol>
          <div className="dashboard-stats">
            <article className="dashboard-stat"><span>Sản phẩm đang đăng bán</span><strong>{publishedCount}</strong></article>
            <article className="dashboard-stat"><span>Tổng sản phẩm trong xưởng</span><strong>{products.length}</strong></article>
            <article className="dashboard-stat"><span>Yêu cầu mới</span><strong>{newOrderCount}</strong></article>
            <article className="dashboard-stat"><span>Doanh thu tháng này</span><strong>{money.format(reports.monthlyIncome)}</strong></article>
            <article className="dashboard-stat"><span>Chi phí tháng này</span><strong>{money.format(reports.monthlyExpenses)}</strong></article>
          </div>
        </section>
      ) : null}

      {activeSection === 'products' ? (
        <section className="workspace-panel" aria-labelledby="products-title">
          <div className="panel-heading"><div><p className="eyebrow">BỘ SƯU TẬP CỦA XƯỞNG</p><h2 id="products-title">Sản phẩm</h2></div><span className="result-count">{products.length} sản phẩm</span></div>
          <form className="product-editor" onSubmit={handleProductSubmit}>
            <div className="editor-heading"><h3>Thêm tác phẩm mới</h3><p>Thông tin sản phẩm được lưu riêng cho gian hàng của bạn.</p></div>
            <div className="editor-grid">
              <div className="field"><label htmlFor="product-name">Tên sản phẩm</label><input id="product-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></div>
              <div className="field"><label htmlFor="product-category">Danh mục</label><select id="product-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ceramics">Gốm sứ</option><option value="textiles">Dệt may</option><option value="bamboo">Mây tre</option><option value="lacquer">Sơn mài</option><option value="other">Khác</option></select></div>
              <div className="field field-wide"><label htmlFor="product-description">Mô tả và câu chuyện sản phẩm</label><textarea id="product-description" name="description" rows={4} maxLength={2000} placeholder="Chất liệu, kỹ thuật chế tác, kích thước và câu chuyện đằng sau tác phẩm…" /></div>
              <div className="field"><label htmlFor="material-cost">Chi phí vật liệu (VNĐ)</label><input id="material-cost" type="number" min="0" max="100000000" value={materialCost} onChange={(event) => setMaterialCost(event.target.value)} required /></div>
              <div className="field"><label htmlFor="labor-cost">Chi phí lao động (VNĐ)</label><input id="labor-cost" type="number" min="0" max="100000000" value={laborCost} onChange={(event) => setLaborCost(event.target.value)} required /></div>
              <div className="field"><label htmlFor="selling-price">Giá bán (VNĐ)</label><input id="selling-price" type="number" min="1" max="100000000" value={price} onChange={(event) => setPrice(event.target.value)} required /></div>
              <div className="field"><label htmlFor="stock-quantity">Số lượng hiện có</label><input id="stock-quantity" name="stockQuantity" type="number" min="0" max="10000" defaultValue="1" required /></div>
              <div className="field field-wide"><label htmlFor="product-images">Ảnh sản phẩm</label><input id="product-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFilesChange} /><small>Tối đa 6 ảnh JPG, PNG hoặc WebP; mỗi ảnh tối đa 5 MB.</small></div>
            </div>
            {imagePreviews.length ? <div className="image-preview-grid">{imagePreviews.map((src, index) => <img src={src} alt={`Ảnh xem trước ${index + 1}`} key={src} />)}</div> : null}
            {recommendation ? <p className="inline-tip">Gợi ý giá mục tiêu: <strong>{money.format(recommendation.targetPrice)}</strong>. <button className="text-button" type="button" onClick={() => setPrice(String(recommendation.targetPrice))}>Dùng mức giá này</button></p> : null}
            <div className="editor-footer"><div className="field"><label htmlFor="product-status">Trạng thái</label><select id="product-status" name="status" defaultValue="draft"><option value="draft">Lưu bản nháp</option><option value="published">Đăng bán</option></select></div><button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu sản phẩm'}</button></div>
          </form>
          {products.length ? <div className="seller-product-list">{products.map((product) => <article className="seller-product-row" key={product.id}><div className="seller-product-image">{product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.name} /> : <span aria-hidden="true">TP</span>}</div><div className="seller-product-info"><strong>{product.name}</strong><span>{categoryLabels[product.category] ?? product.category} · {money.format(product.price)}</span></div><span className={`status-pill status-${product.status}`}>{statusLabels[product.status] ?? product.status}</span>{product.status === 'draft' ? <button className="button button-outline" type="button" onClick={() => updateProductStatus(product.id, 'published')}>Đăng bán</button> : product.status === 'published' ? <button className="button button-quiet" type="button" onClick={() => updateProductStatus(product.id, 'draft')}>Tạm ẩn</button> : null}</article>)}</div> : <div className="empty-state compact-empty"><h3>Chưa có sản phẩm nào.</h3><p>Thêm ảnh, câu chuyện và chi phí để bắt đầu xây dựng bộ sưu tập.</p></div>}
        </section>
      ) : null}

      {activeSection === 'orders' ? (
        <section className="workspace-panel" aria-labelledby="orders-title">
          <div className="panel-heading"><div><p className="eyebrow">KẾT NỐI VỚI KHÁCH HÀNG</p><h2 id="orders-title">Yêu cầu đặt hàng</h2></div><span className="result-count">{orders.length} yêu cầu</span></div>
          {orders.length ? <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><div><span className={`status-pill status-${order.status}`}>{statusLabels[order.status] ?? order.status}</span><h3>{order.buyerName}</h3></div><strong>{money.format(order.totalAmount)}</strong></div><p className="order-contact">{order.buyerEmail} · {order.buyerPhone}</p><ul className="order-items">{order.items.map((item, index) => <li key={`${order.id}-${index}`}><span>{item.productName} × {item.quantity}</span><span>{money.format(item.lineTotal)}</span></li>)}</ul>{order.note ? <p className="order-note">Lời nhắn: {order.note}</p> : null}<div className="order-card-footer"><span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>{order.status === 'new' ? <><button className="button button-primary" type="button" onClick={() => updateOrderStatus(order.id, 'accepted')}>Xác nhận</button><button className="button button-quiet" type="button" onClick={() => updateOrderStatus(order.id, 'cancelled')}>Từ chối</button></> : order.status === 'accepted' ? <button className="button button-primary" type="button" onClick={() => updateOrderStatus(order.id, 'completed')}>Đánh dấu hoàn tất</button> : null}</div></article>)}</div> : <div className="empty-state compact-empty"><h3>Chưa có yêu cầu đặt hàng.</h3><p>Khi khách quan tâm đến sản phẩm, yêu cầu của họ sẽ xuất hiện ở đây.</p></div>}
        </section>
      ) : null}

      {activeSection === 'finance' ? (
        <section className="workspace-panel" aria-labelledby="finance-title">
          <div className="panel-heading"><div><p className="eyebrow">SỔ THU CHI CỦA XƯỞNG</p><h2 id="finance-title">Thu chi và báo cáo</h2><p className="panel-description">Đơn hàng hoàn tất được ghi thành doanh thu; chi phí nhập kho được ghi tự động.</p></div></div>
          <div className="finance-summary">
            <article><span>Doanh thu 7 ngày</span><strong>{money.format(reports.weeklyIncome)}</strong></article>
            <article><span>Chi phí 7 ngày</span><strong>{money.format(reports.weeklyExpenses)}</strong></article>
            <article><span>Doanh thu tháng này</span><strong>{money.format(reports.monthlyIncome)}</strong></article>
            <article><span>Chi phí tháng này</span><strong>{money.format(reports.monthlyExpenses)}</strong></article>
          </div>
          <div className="finance-layout">
            <form className="finance-entry-form form-stack" onSubmit={handleFinanceSubmit}>
              <div className="editor-heading"><h3>Ghi bút toán</h3><p>Nhập doanh thu hoặc khoản chi của xưởng.</p></div>
              <div className="field"><label htmlFor="entry-type">Loại bút toán</label><select id="entry-type" name="entryType" defaultValue="expense"><option value="income">Doanh thu</option><option value="expense">Chi phí</option></select></div>
              <div className="field"><label htmlFor="entry-category">Danh mục</label><select id="entry-category" name="category" defaultValue="materials"><option value="sales">Doanh thu bán hàng</option><option value="materials">Nguyên vật liệu</option><option value="labor">Nhân công</option><option value="packaging">Bao bì và vận chuyển</option><option value="operating">Vận hành xưởng</option><option value="other">Khác</option></select></div>
              <div className="field"><label htmlFor="entry-description">Diễn giải</label><input id="entry-description" name="description" minLength={2} maxLength={240} required placeholder="Ví dụ: mua men màu" /></div>
              <div className="finance-form-row"><div className="field"><label htmlFor="entry-amount">Số tiền (VNĐ)</label><input id="entry-amount" name="amount" type="number" min="1" max="100000000" required /></div><div className="field"><label htmlFor="entry-date">Ngày</label><input id="entry-date" name="entryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div></div>
              <div className="field"><label htmlFor="entry-payment">Kênh thanh toán</label><select id="entry-payment" name="paymentMethod" defaultValue="cash"><option value="cash">Tiền mặt</option><option value="bank">Chuyển khoản ngân hàng</option><option value="other">Khác</option></select></div>
              <button className="button button-primary button-full" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : 'Ghi vào sổ'}</button>
            </form>
            <div className="finance-ledger">
              <div className="ledger-heading"><h3>Sổ gần đây</h3><span>{financialEntries.length} bút toán</span></div>
              {financialEntries.length ? <div className="ledger-list">{financialEntries.map((entry) => <article className="ledger-row" key={entry.id}><div><strong>{entry.description}</strong><span>{entry.entryDate} · {financeCategoryLabels[entry.category] ?? entry.category}</span></div><strong className={entry.entryType === 'income' ? 'ledger-income' : 'ledger-expense'}>{entry.entryType === 'income' ? '+' : '−'}{money.format(entry.amount)}</strong></article>)}</div> : <div className="empty-state compact-empty"><h3>Sổ sách đang bắt đầu trống.</h3><p>Ghi chi phí xưởng hoặc hoàn tất một đơn hàng để có báo cáo đầu tiên.</p></div>}
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === 'inventory' ? (
        <section className="workspace-panel" aria-labelledby="inventory-title">
          <div className="panel-heading"><div><p className="eyebrow">NGUYÊN VẬT LIỆU VÀ TỒN KHO</p><h2 id="inventory-title">Kho vật tư</h2><p className="panel-description">Theo dõi lượng đang có, chi phí nhập và ngưỡng cần bổ sung.</p></div><span className="result-count">{inventoryItems.length} mặt hàng</span></div>
          <form className="inventory-editor" onSubmit={handleInventorySubmit}>
            <div className="editor-heading"><h3>Thêm vật tư</h3><p>Khi có số lượng và đơn giá ban đầu, hệ thống tự ghi nhận khoản chi nhập kho.</p></div>
            <div className="editor-grid">
              <div className="field"><label htmlFor="inventory-name">Tên vật tư</label><input id="inventory-name" name="name" required minLength={2} maxLength={120} placeholder="Đất sét, sợi, gỗ…" /></div>
              <div className="field"><label htmlFor="inventory-unit">Đơn vị tính</label><input id="inventory-unit" name="unit" required maxLength={24} placeholder="kg, mét, bao…" /></div>
              <div className="field"><label htmlFor="inventory-quantity">Số lượng ban đầu</label><input id="inventory-quantity" name="quantity" type="number" step="0.01" min="0" defaultValue="0" required /></div>
              <div className="field"><label htmlFor="inventory-cost">Đơn giá vật tư (VNĐ)</label><input id="inventory-cost" name="unitCost" type="number" min="0" defaultValue="0" required /></div>
              <div className="field"><label htmlFor="inventory-reorder">Ngưỡng báo sắp hết</label><input id="inventory-reorder" name="reorderLevel" type="number" step="0.01" min="0" defaultValue="0" required /></div>
            </div>
            <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : 'Thêm vào kho'}</button>
          </form>
          {inventoryItems.length ? <div className="inventory-list">{inventoryItems.map((item) => {
            const lowStock = item.reorderLevel > 0 && item.quantity <= item.reorderLevel
            return <article className="inventory-row" key={item.id}>
              <div className="inventory-info"><strong>{item.name}</strong><span>{money.format(item.unitCost)} / {item.unit}</span></div>
              <div className="inventory-level"><strong>{item.quantity} {item.unit}</strong><span className={lowStock ? 'stock-low' : ''}>{lowStock ? 'Sắp chạm ngưỡng bổ sung' : `Ngưỡng bổ sung: ${item.reorderLevel} ${item.unit}`}</span></div>
              <div className="inventory-adjust"><label className="sr-only" htmlFor={`movement-qty-${item.id}`}>Số lượng điều chỉnh {item.name}</label><input id={`movement-qty-${item.id}`} type="number" min="0.01" step="0.01" value={movementQuantity[item.id] ?? ''} onChange={(event) => setMovementQuantity((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Số lượng" /><label className="sr-only" htmlFor={`movement-cost-${item.id}`}>Đơn giá nhập {item.name}</label><input id={`movement-cost-${item.id}`} type="number" min="0" value={movementUnitCost[item.id] ?? String(item.unitCost)} onChange={(event) => setMovementUnitCost((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Đơn giá nhập" /><button className="button button-outline" type="button" disabled={pending || !movementQuantity[item.id]} onClick={() => recordInventoryMovement(item.id, 'stock_in')}>Nhập</button><button className="button button-quiet" type="button" disabled={pending || !movementQuantity[item.id]} onClick={() => recordInventoryMovement(item.id, 'stock_out')}>Xuất</button></div>
            </article>
          })}</div> : <div className="empty-state compact-empty"><h3>Chưa có vật tư trong kho.</h3><p>Thêm đất, sợi, gỗ hoặc vật liệu khác để theo dõi số lượng và chi phí nhập.</p></div>}
          {inventoryMovements.length ? <div className="inventory-history"><div className="ledger-heading"><h3>Nhật ký nhập xuất</h3><span>{inventoryMovements.length} lần gần nhất</span></div>{inventoryMovements.map((movement) => <article className="ledger-row" key={movement.id}><div><strong>{movement.itemName}</strong><span>{new Date(movement.occurredAt).toLocaleDateString('vi-VN')} · {movement.note || (movement.movementType === 'stock_in' ? 'Nhập kho' : 'Xuất kho')}</span></div><strong className={movement.movementType === 'stock_in' ? 'ledger-income' : 'ledger-expense'}>{movement.movementType === 'stock_in' ? '+' : '−'}{movement.quantity}</strong></article>)}</div> : null}
        </section>
      ) : null}

      {activeSection === 'pricing' ? (
        <section className="workspace-panel" aria-labelledby="pricing-title">
          <div className="panel-heading"><div><p className="eyebrow">ĐỊNH GIÁ CÓ CƠ SỞ</p><h2 id="pricing-title">Gợi ý giá bán</h2><p className="panel-description">Đối chiếu chi phí và dữ liệu từ các sản phẩm, yêu cầu được chấp nhận trên marketplace.</p></div></div>
          <div className="pricing-layout">
            <form className="form-stack pricing-form" onSubmit={getPriceRecommendation}>
              <div className="field"><label htmlFor="pricing-name">Tên tác phẩm</label><input id="pricing-name" value={pricingName} onChange={(event) => setPricingName(event.target.value)} minLength={2} maxLength={120} required /></div>
              <div className="field"><label htmlFor="pricing-category">Danh mục so sánh</label><select id="pricing-category" value={pricingCategory} onChange={(event) => setPricingCategory(event.target.value)}><option value="ceramics">Gốm sứ</option><option value="textiles">Dệt may</option><option value="bamboo">Mây tre</option><option value="lacquer">Sơn mài</option><option value="other">Khác</option></select></div>
              <div className="field"><label htmlFor="pricing-material">Chi phí vật liệu (VNĐ)</label><input id="pricing-material" type="number" min="0" max="100000000" value={pricingMaterial} onChange={(event) => setPricingMaterial(event.target.value)} required /></div>
              <div className="field"><label htmlFor="pricing-labor">Chi phí lao động (VNĐ)</label><input id="pricing-labor" type="number" min="0" max="100000000" value={pricingLabor} onChange={(event) => setPricingLabor(event.target.value)} required /></div>
              <button className="button button-primary button-full" type="submit" disabled={pending}>{pending ? 'Đang phân tích…' : 'Phân tích và gợi ý giá'}</button>
            </form>
            <div className="pricing-results" aria-live="polite">
              {recommendation ? <>
                <p className="confidence-label">{recommendation.confidence}</p>
                <div className="market-signals"><span>{recommendation.market.listingCount} sản phẩm cùng danh mục</span><span>{recommendation.market.acceptedOrders} đơn được chấp nhận</span><span>{recommendation.market.acceptedUnits} sản phẩm trong các đơn đó</span></div>
                <div className="price-options"><article><span>Giá sàn</span><strong>{money.format(recommendation.floorPrice)}</strong></article><article className="price-featured"><span>Giá đề xuất</span><strong>{money.format(recommendation.targetPrice)}</strong><button className="text-button" type="button" onClick={() => { setPrice(String(recommendation.targetPrice)); setActiveSection('products') }}>Dùng cho sản phẩm mới</button></article><article><span>Giá cao cấp</span><strong>{money.format(recommendation.premiumPrice)}</strong></article></div>
                <p className="pricing-rationale">{recommendation.rationale}</p><p className="pricing-market-note">{recommendation.marketNote}</p>
              </> : <div className="pricing-empty"><span className="empty-mark" aria-hidden="true">TP</span><h3>Định giá từ dữ liệu thật của marketplace.</h3><p>Kết quả dùng chi phí bạn nhập cùng số lượng sản phẩm và đơn được nghệ nhân chấp nhận trong cùng danh mục. Không có dữ liệu ngoài sàn.</p></div>}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
