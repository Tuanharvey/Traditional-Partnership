'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password })

      if (result.error) {
        setError(isSignUp ? 'Không thể tạo tài khoản với thông tin này.' : 'Email hoặc mật khẩu chưa chính xác.')
        return
      }

      router.replace('/seller/dashboard')
      router.refresh()
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-aside">
        <p className="eyebrow">TRADITIONAL PARTNERSHIP</p>
        <h1>{isSignUp ? 'Mở gian hàng của riêng bạn.' : 'Chào mừng bạn trở lại.'}</h1>
        <p>Quản lý tác phẩm, theo dõi chi phí và kết nối với người yêu thủ công Việt.</p>
        <Link className="text-link" href="/">Về trang giới thiệu <span aria-hidden="true">↗</span></Link>
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">KHÔNG GIAN NGƯỜI BÁN</p>
        <h2 id="auth-title">{isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>
        <p className="auth-description">{isSignUp ? 'Bắt đầu xây dựng gian hàng thủ công của bạn.' : 'Đăng nhập để tiếp tục quản lý gian hàng.'}</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          {isSignUp ? (
            <div className="field">
              <label htmlFor="auth-name">Họ và tên</label>
              <input id="auth-name" type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={100} required />
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Mật khẩu</label>
            <input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required />
            {isSignUp ? <small>Dùng ít nhất 8 ký tự.</small> : null}
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-primary button-full" type="submit" disabled={pending}>
            {pending ? 'Đang xử lý…' : isSignUp ? 'Tạo tài khoản người bán' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-switch">
          {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <Link href={isSignUp ? '/seller/sign-in' : '/seller/sign-up'}>{isSignUp ? 'Đăng nhập' : 'Tạo tài khoản'}</Link>
        </p>
      </section>
    </main>
  )
}
