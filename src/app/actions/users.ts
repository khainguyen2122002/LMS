'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendUserApprovedEmail, sendUserRejectedEmail } from '@/lib/email'

export async function updateUserRole(userId: string, newRole: string, rejectionReason?: string) {
  const supabase = await createClient()

  // Verify the current user is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can perform this action' }
  }

  // Update the target user's role
  const updateData: any = { role: newRole }
  
  if (newRole === 'student' || newRole === 'lecturer' || newRole === 'admin') {
    updateData.approved_by = user.id
    updateData.approved_at = new Date().toISOString()
  } else if (newRole === 'rejected') {
    updateData.rejected_by = user.id
    updateData.rejection_reason = rejectionReason
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select('email') // Lấy email để gửi thông báo
    .single()

  if (error) {
    return { error: error.message }
  }

  // Lấy email target user
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  const targetEmail = targetUser?.email

  if (targetEmail) {
    if (newRole === 'student' || newRole === 'lecturer') {
      await sendUserApprovedEmail(targetEmail)
    } else if (newRole === 'rejected' && rejectionReason) {
      await sendUserRejectedEmail(targetEmail, rejectionReason)
    }
  }

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function updateUserProfile(profileData: {
  full_name?: string
  phone?: string
  company?: string
  position?: string
  industry?: string
  experience_years?: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: profileData.full_name,
      phone: profileData.phone,
      company: profileData.company,
      position: profileData.position,
      industry: profileData.industry,
      experience_years: profileData.experience_years,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const supabase = await createClient()

  // Verify the current user is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can perform this action' }
  }

  // Cập nhật is_active trong profiles
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function createUserByAdmin(
  userData: {
    email: string
    fullName: string
    phone?: string
    company?: string
    position?: string
    industry?: string
    experienceYears?: number | null
    role: string
    is_active?: boolean
  },
  passwordFirstTime: string
) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = await createClient()

  // Verify the current user is an admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can perform this action' }
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (e: any) {
    return { error: 'Lỗi cấu hình hệ thống: Thiếu SUPABASE_SERVICE_ROLE_KEY trong env.local' }
  }

  // Gọi API Admin Auth tạo user trong bảng Auth
  const { data, error } = await adminClient.auth.admin.createUser({
    email: userData.email,
    password: passwordFirstTime,
    email_confirm: true, // Tự động xác nhận email
    user_metadata: {
      full_name: userData.fullName,
      phone: userData.phone || null,
      company: userData.company || null,
      position: userData.position || null,
      industry: userData.industry || null,
      experience_years: userData.experienceYears || null,
      role: userData.role,
      is_active: userData.is_active !== undefined ? userData.is_active : true
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Backup upsert vào public.profiles đề phòng trigger có trễ
  if (data.user) {
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: data.user.id,
      email: userData.email,
      full_name: userData.fullName,
      phone: userData.phone || null,
      company: userData.company || null,
      position: userData.position || null,
      industry: userData.industry || null,
      experience_years: userData.experienceYears || null,
      role: userData.role,
      is_active: userData.is_active !== undefined ? userData.is_active : true
    }, { onConflict: 'id' })

    if (profileError) {
      console.error("Backup upsert profiles error:", profileError.message)
    }
  }

  revalidatePath('/dashboard/admin/users')
  return { success: true, userId: data.user?.id }
}

export async function createMultipleUsersByAdmin(
  usersList: Array<{
    email: string
    fullName: string
    phone?: string
    company?: string
    position?: string
    industry?: string
    experienceYears?: number | null
    role: string
    is_active?: boolean
    passwordFirstTime: string
  }>
) {
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabase = await createClient()

  // Verify the current user is an admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can perform this action' }
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch (e: any) {
    return { error: 'Lỗi cấu hình hệ thống: Thiếu SUPABASE_SERVICE_ROLE_KEY trong env.local' }
  }

  const results = []
  let successCount = 0
  let errorCount = 0

  for (const userData of usersList) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.passwordFirstTime,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        phone: userData.phone || null,
        company: userData.company || null,
        position: userData.position || null,
        industry: userData.industry || null,
        experience_years: userData.experienceYears || null,
        role: userData.role,
        is_active: userData.is_active !== undefined ? userData.is_active : true
      }
    })

    if (error) {
      errorCount++
      results.push({ email: userData.email, success: false, error: error.message })
    } else {
      successCount++
      results.push({ email: userData.email, success: true, userId: data.user?.id })

      if (data.user) {
        await adminClient.from('profiles').upsert({
          id: data.user.id,
          email: userData.email,
          full_name: userData.fullName,
          phone: userData.phone || null,
          company: userData.company || null,
          position: userData.position || null,
          industry: userData.industry || null,
          experience_years: userData.experienceYears || null,
          role: userData.role,
          is_active: userData.is_active !== undefined ? userData.is_active : true
        }, { onConflict: 'id' })
      }
    }
  }

  revalidatePath('/dashboard/admin/users')
  return { success: true, successCount, errorCount, results }
}
