'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return <button className="button button-quiet" onClick={handleSignOut}>Đăng xuất</button>
}
