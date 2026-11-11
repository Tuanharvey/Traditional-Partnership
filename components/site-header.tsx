import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Traditional Partnership — trang chủ">
          <span className="brand-symbol" aria-hidden="true">TP</span>
          <span className="brand-name">
            <strong>Traditional Partnership</strong>
            <small>Bảo tồn · Phát triển làng nghề</small>
          </span>
        </Link>
        <nav className="primary-nav" aria-label="Điều hướng chính">
          <Link href="/#mission">Sứ mệnh</Link>
          <Link href="/#community">Cộng đồng</Link>
          <Link href="/shop">Cửa hàng</Link>
        </nav>
        <Link className="header-seller-link" href="/seller/sign-in">Không gian người bán <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  )
}
