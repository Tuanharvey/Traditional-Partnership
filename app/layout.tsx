import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SiteHeader } from '@/components/site-header'

export const metadata: Metadata = {
  title: {
    default: 'Traditional Partnership — Làng nghề Việt Nam',
    template: '%s · Traditional Partnership',
  },
  description: 'Không gian kết nối nghệ nhân, câu chuyện làng nghề và những tác phẩm thủ công Việt Nam.',
}

export const viewport: Viewport = {
  themeColor: '#f5f3ed',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <span>Traditional Partnership</span>
          <span>Gìn giữ nghề · Kết nối cộng đồng</span>
        </footer>
      </body>
    </html>
  )
}
