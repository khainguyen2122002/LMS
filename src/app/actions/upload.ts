'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@/utils/supabase/server'

export async function uploadFile(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Chưa đăng nhập' }

    // Verify admin/lecturer role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
      return { error: 'Không có quyền thực hiện thao tác này' }
    }

    const file = formData.get('file') as File | null
    if (!file) return { error: 'Không tìm thấy file' }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Tạo tên file an toàn: timestamp_tên_file_gốc
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${cleanFileName}`

    // Đường dẫn đích: public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // Đảm bảo thư mục tồn tại
    await mkdir(uploadDir, { recursive: true })

    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${fileName}`

    return { 
      success: true, 
      url: fileUrl, 
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    }
  } catch (error: any) {
    return { error: error.message || 'Lỗi khi upload file' }
  }
}
