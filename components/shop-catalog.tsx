'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type PublicProduct = {
  id: string
  name: string
  description: string
  category: string
  price: number
  imageUrls: string[]
  shopName: string
}

const categoryNames: Record<string, string> = {
  ceramics: 'Gốm sứ',
  textiles: 'Dệt may',
  bamboo: 'Mây tre',
  lacquer: 'Sơn mài',
  other: 'Khác',
}

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

type ShopCatalogProps = { products: PublicProduct[] }

export function ShopCatalog({ products }: ShopCatalogProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products])
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const searchable = `${product.name} ${product.description} ${product.shopName}`.toLocaleLowerCase('vi')
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [category, products, query])

  const cartItems = products.filter((product) => cart[product.id])
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const cartTotal = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0)

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + amount
      if (nextQuantity < 1) {
        const next = { ...current }
        delete next[productId]
        return next
      }
      return { ...current, [productId]: Math.min(10, nextQuantity) }
    })
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setPending(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerPhone,
          note,
          items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setMessage(result.error ?? 'Chưa thể gửi yêu cầu đặt hàng.')
        return
      }

      setCart({})
      setNote('')
      setMessage('Yêu cầu đã được gửi đến nghệ nhân. Họ sẽ liên hệ để xác nhận thanh toán và giao hàng.')
      dialogRef.current?.close()
    } catch {
      setMessage('Kết nối đang gián đoạn. Vui lòng thử lại sau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="catalog-toolbar">
        <div>
          <p className="eyebrow">TÁC PHẨM ĐƯỢC GIỚI THIỆU</p>
          <h2 id="catalog-title">Gian hàng thủ công</h2>
          <p>{products.length} tác phẩm đang được đăng bán bởi cộng đồng.</p>
        </div>
        <div className="catalog-actions">
          <label className="sr-only" htmlFor="product-search">Tìm sản phẩm</label>
          <input id="product-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, xưởng…" />
          <label className="sr-only" htmlFor="category-filter">Lọc theo danh mục</label>
          <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Tất cả danh mục</option>
            {categories.map((item) => <option key={item} value={item}>{categoryNames[item] ?? item}</option>)}
          </select>
          <button className="button button-primary cart-button" type="button" disabled={!cartCount} onClick={() => dialogRef.current?.showModal()}>
            Giỏ hàng <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>

      {visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image-wrap">
                {product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.name} loading="lazy" /> : <div className="product-image-empty" aria-hidden="true">TP</div>}
                <span className="product-category">{categoryNames[product.category] ?? product.category}</span>
              </div>
              <div className="product-card-content">
                <p className="product-shop">{product.shopName}</p>
                <h3>{product.name}</h3>
                <p className="product-description">{product.description || 'Tác phẩm thủ công được giới thiệu bởi nghệ nhân.'}</p>
                <div className="product-card-footer">
                  <strong>{money.format(product.price)}</strong>
                  <button className="button button-outline" type="button" onClick={() => changeQuantity(product.id, 1)}>
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state catalog-empty">
          <span className="empty-mark" aria-hidden="true">TP</span>
          <h3>{products.length ? 'Chưa có sản phẩm phù hợp.' : 'Những tác phẩm đầu tiên sẽ xuất hiện tại đây.'}</h3>
          <p>{products.length ? 'Thử tìm bằng từ khóa khác hoặc xem tất cả danh mục.' : 'Gian hàng hiện chưa có sản phẩm đăng bán. Nghệ nhân có thể bắt đầu xây dựng bộ sưu tập của mình.'}</p>
          {!products.length ? <Link className="text-link" href="/seller/sign-in">Dành cho nghệ nhân <span aria-hidden="true">↗</span></Link> : null}
        </div>
      )}

      {message ? <p className="notice" role="status">{message}</p> : null}

      <dialog className="checkout-dialog" ref={dialogRef} aria-labelledby="checkout-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">YÊU CẦU ĐẶT HÀNG</p>
            <h2 id="checkout-title">Thông tin liên hệ</h2>
          </div>
          <button className="dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Đóng cửa sổ">×</button>
        </div>
        <div className="checkout-lines">
          {cartItems.map((product) => (
            <div className="checkout-line" key={product.id}>
              <div><strong>{product.name}</strong><small>{money.format(product.price)} · {product.shopName}</small></div>
              <div className="quantity-control" aria-label={`Số lượng ${product.name}`}>
                <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label="Giảm số lượng">−</button>
                <span>{cart[product.id]}</span>
                <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label="Tăng số lượng">+</button>
              </div>
            </div>
          ))}
          <div className="checkout-total"><span>Tạm tính</span><strong>{money.format(cartTotal)}</strong></div>
        </div>
        <form className="form-stack" onSubmit={submitOrder}>
          <div className="field"><label htmlFor="buyer-name">Họ và tên</label><input id="buyer-name" autoComplete="name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} required maxLength={120} /></div>
          <div className="field"><label htmlFor="buyer-email">Email</label><input id="buyer-email" type="email" autoComplete="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} required maxLength={254} /></div>
          <div className="field"><label htmlFor="buyer-phone">Số điện thoại</label><input id="buyer-phone" type="tel" autoComplete="tel" value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} required minLength={8} maxLength={32} /></div>
          <div className="field"><label htmlFor="buyer-note">Lời nhắn <span>(không bắt buộc)</span></label><textarea id="buyer-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></div>
          <p className="checkout-note">Đây là yêu cầu đặt hàng, chưa phải thanh toán. Nghệ nhân sẽ xác nhận giá, phương thức thanh toán và giao hàng trực tiếp.</p>
          <button className="button button-primary button-full" type="submit" disabled={pending || !cartCount}>{pending ? 'Đang gửi…' : 'Gửi yêu cầu đặt hàng'}</button>
        </form>
      </dialog>
    </section>
  )
}
