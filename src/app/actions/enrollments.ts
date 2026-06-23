'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Lấy danh sách đăng ký học của khóa học
export async function getCourseEnrollments(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      progress_percentage,
      status,
      blocked_lessons,
      student:profiles!user_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('course_id', courseId)

  if (error) return { error: error.message }
  return { success: true, data }
}

// 2. Phê duyệt đăng ký học
export async function approveEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('id', enrollmentId)
    .single()

  if (fetchError || !enrollment) return { error: 'Không tìm thấy đăng ký học' }

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'active', enrolled_at: new Date().toISOString() })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  // Gửi thông báo cho học viên
  await supabase.from('notifications').insert({
    user_id: enrollment.user_id,
    title: 'Yêu cầu tham gia khóa học đã được duyệt',
    message: 'Chào mừng bạn! Quản trị viên đã phê duyệt yêu cầu tham gia khóa học của bạn.',
    type: 'system',
    link: `/dashboard/learning`
  })

  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true }
}

// 3. Từ chối đăng ký học
export async function rejectEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('id', enrollmentId)
    .single()

  if (fetchError || !enrollment) return { error: 'Không tìm thấy đăng ký học' }

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'rejected' })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  // Gửi thông báo cho học viên
  await supabase.from('notifications').insert({
    user_id: enrollment.user_id,
    title: 'Yêu cầu tham gia khóa học đã bị từ chối',
    message: 'Rất tiếc, yêu cầu tham gia khóa học của bạn không được phê duyệt. Vui lòng liên hệ ban quản trị.',
    type: 'system',
    link: `/dashboard/courses`
  })

  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true }
}

// 4. Admin gán học viên trực tiếp vào khóa học
export async function enrollStudentByAdmin(courseId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  // Kiểm tra xem đã đăng ký chưa
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', studentId)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    if (existing.status === 'active') {
      return { error: 'Học viên đã tham gia khóa học này rồi' }
    }
    // Nếu ở trạng thái khác, cập nhật lại thành active
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    // Thêm đăng ký mới
    const { error } = await supabase
      .from('enrollments')
      .insert({
        user_id: studentId,
        course_id: courseId,
        status: 'active'
      })

    if (error) return { error: error.message }
  }

  // Gửi thông báo cho học viên
  await supabase.from('notifications').insert({
    user_id: studentId,
    title: 'Bạn được gán vào khóa học mới',
    message: 'Quản trị viên đã thêm bạn trực tiếp vào một khóa học mới.',
    type: 'system',
    link: `/dashboard/learning`
  })

  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true }
}

// 5. Xóa học viên khỏi khóa học
export async function removeStudentFromCourse(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true }
}

// 6. Cập nhật phân quyền bài học bị chặn
export async function updateBlockedLessons(enrollmentId: string, blockedLessons: string[], courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { error } = await supabase
    .from('enrollments')
    .update({ blocked_lessons: blockedLessons })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true }
}

// 7. Lấy danh sách tất cả học viên trong hệ thống để phục vụ thêm trực tiếp
export async function getAllStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('full_name')

  if (error) return { error: error.message }
  return { success: true, data }
}
