import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CategoriesClient from './CategoriesClient'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  // 1. Kiểm tra quyền truy cập (Admin/Lecturer)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
    redirect('/dashboard')
  }

  // 2. Lấy danh sách danh mục hiện có
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })

  return (
    <div className="p-6">
      <CategoriesClient initialCategories={categories || []} />
    </div>
  )
}
