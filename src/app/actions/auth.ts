'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { sendNewUserAdminNotification } from '@/lib/email'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (process.env.NODE_ENV === 'development' && email === 'student@local.test' && password === '123456') {
    const cookieStore = await cookies()
    cookieStore.set('dev_preview_role', 'student', { path: '/', httpOnly: false, maxAge: 3600 })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Kiểm tra trạng thái is_active
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('email', email)
    .single()

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut()
    return { error: 'Tài khoản của bạn đã bị vô hiệu hóa hoặc chưa được kích hoạt bởi Quản trị viên.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
  return { error: 'Đăng ký tài khoản tự do đã bị vô hiệu hóa trên hệ thống này. Vui lòng liên hệ với Quản trị viên để được tạo tài khoản.' }
}

export async function signout() {
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies()
    cookieStore.delete('dev_preview_role')
    cookieStore.delete('dev_mock_db')
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

