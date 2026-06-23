'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAssignment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const assignmentId = formData.get('assignmentId') as string
  const courseId = formData.get('courseId') as string
  const lessonId = formData.get('lessonId') as string
  const type = formData.get('type') as string
  const content = formData.get('content') as string
  const file = formData.get('file') as File | null

  // 1. Logic giả lập đẩy lên SharePoint/OneDrive
  // Trong thực tế, bạn sẽ dùng Microsoft Graph API tại đây
  let attachmentUrl = content // Nếu là link hoặc text
  let sharepointPath = ''

  if (type === 'file' && file) {
    // Giả lập đường dẫn SharePoint
    const timestamp = new Date().getTime()
    sharepointPath = `KhoaHoc_${courseId}/BaiTap_${assignmentId}/${user.email}_${timestamp}_${file.name}`
    // Ở đây chúng ta tạm thời dùng URL giả lập hoặc upload lên Supabase Storage nếu muốn
    attachmentUrl = `https://inspiringhr.sharepoint.com/sites/LMS/Shared%20Documents/${sharepointPath}`
  }

  // 2. Lưu vào Database
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      user_id: user.id,
      attachment_url: attachmentUrl,
      sharepoint_path: sharepointPath,
      student_note: type === 'text' ? content : '',
      status: 'pending',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/learning/${courseId}/lessons/${lessonId}`)
  return { success: true, data: submission }
}

export async function gradeSubmission(submissionId: string, score: number, feedback: string, status: 'passed' | 'failed') {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) return { error: 'Unauthorized' }

  // 1. Cập nhật bảng submissions
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .update({
      score,
      feedback,
      status,
      graded_by: adminUser.id,
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select('*, assignment:assignments(lesson_id)')
    .single()

  if (subError) return { error: subError.message }

  // 2. Tạo thông báo cho học viên
  await supabase.from('notifications').insert({
    user_id: submission.user_id,
    title: `Bài tập đã được chấm điểm: ${status === 'passed' ? 'Đạt' : 'Chưa đạt'}`,
    message: `Giảng viên đã chấm bài tập của bạn với số điểm ${score}/100.`,
    type: 'grade',
    link: `/dashboard/learning/any/lessons/${submission.assignment.lesson_id}` // Cần truyền courseId đúng nếu có
  })

  // 3. Nếu Đạt, kiểm tra xem có cần đánh dấu hoàn thành bài học không
  if (status === 'passed') {
    // Logic này có thể phức tạp hơn nếu muốn tự động hóa
  }

  return { success: true }
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}
