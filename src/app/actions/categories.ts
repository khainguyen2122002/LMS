'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function createCategory(formData: { name: string; description: string; order_index: number }) {
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

  const slug = slugify(formData.name)

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: formData.name,
      slug,
      description: formData.description || null,
      order_index: formData.order_index || 0
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin/categories')
  return { success: true, data }
}

export async function updateCategory(id: string, formData: { name: string; description: string; order_index: number }) {
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

  const slug = slugify(formData.name)

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: formData.name,
      slug,
      description: formData.description || null,
      order_index: formData.order_index || 0
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin/categories')
  return { success: true, data }
}

export async function deleteCategory(id: string) {
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

  // Check if any courses are using this category
  const { count, error: courseCheckError } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (courseCheckError) {
    return { error: courseCheckError.message }
  }

  if (count && count > 0) {
    return { error: `Không thể xóa danh mục này vì đang có ${count} khóa học liên kết.` }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin/categories')
  return { success: true }
}
