import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
const maximumImageSize = 5 * 1024 * 1024

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Chưa chọn ảnh.' }, { status: 400 })

  const extension = imageTypes.get(file.type)
  if (!extension || file.size === 0 || file.size > maximumImageSize) {
    return NextResponse.json({ error: 'Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 5 MB.' }, { status: 400 })
  }

  try {
    const blob = await put(`products/${session.user.id}/${randomUUID()}.${extension}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch {
    return NextResponse.json({ error: 'Chưa thể tải ảnh lên. Vui lòng thử lại.' }, { status: 500 })
  }
}
