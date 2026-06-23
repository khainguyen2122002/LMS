'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(lessonId: string, courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) {
    return { error: 'You are not enrolled in this course' }
  }

  // Check if already completed
  const { data: existingProgress } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lessonId)
    .single()

  if (existingProgress) {
    // Update it
    await supabase
      .from('lesson_progress')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', existingProgress.id)
  } else {
    // Insert it
    await supabase
      .from('lesson_progress')
      .insert({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString()
      })
  }

  revalidatePath(`/dashboard/learning/${courseId}/lessons`)
  return { success: true }
}

export async function updateLessonProgress(lessonId: string, courseId: string, watchTimeSeconds: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) return { error: 'Not enrolled' }

  // Update or insert progress
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('id, watch_time_seconds')
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lessonId)
    .single()

  if (existing) {
    // Chỉ cập nhật nếu thời gian mới lớn hơn thời gian cũ
    if (watchTimeSeconds > (existing.watch_time_seconds || 0)) {
      await supabase
        .from('lesson_progress')
        .update({ watch_time_seconds: watchTimeSeconds })
        .eq('id', existing.id)
    }
  } else {
    await supabase
      .from('lesson_progress')
      .insert({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        watch_time_seconds: watchTimeSeconds
      })
  }

  return { success: true }
}

export async function submitCheckpointQuiz(lessonId: string, courseId: string, answers: { questionId: string, answerIndex: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Lấy đáp án đúng từ DB
  const { data: quizzes } = await supabase
    .from('lesson_quizzes')
    .select('*')
    .eq('lesson_id', lessonId)

  if (!quizzes || quizzes.length === 0) return { error: 'No quiz found' }

  // 2. Kiểm tra kết quả
  let correctCount = 0
  quizzes.forEach((q: any) => {
    const userAnswer = answers.find((a: any) => a.questionId === q.id)
    if (userAnswer && userAnswer.answerIndex === q.correct_option_index) {
      correctCount++
    }
  })

  const isPassed = correctCount === quizzes.length

  if (isPassed) {
    // Đánh dấu hoàn thành bài học
    await markLessonComplete(lessonId, courseId)
  }

  // Trả về kết quả chi tiết kèm đáp án đúng và giải thích
  return {
    success: isPassed,
    correctCount,
    totalCount: quizzes.length,
    message: isPassed 
      ? 'Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi và hoàn thành bài học.' 
      : `Bạn trả lời đúng ${correctCount}/${quizzes.length} câu hỏi. Hãy xem lại giải thích phía dưới và thử lại.`,
    gradedQuizzes: quizzes.map((q: any) => {
      const userAnswer = answers.find((a: any) => a.questionId === q.id)
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correct_option_index: q.correct_option_index,
        explanation: q.explanation || 'Không có giải thích chi tiết.',
        userAnswerIndex: userAnswer ? userAnswer.answerIndex : null
      }
    })
  }
}

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Lấy tên của học viên để tạo thông báo cho Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: course } = await supabase
    .from('courses')
    .select('title, lecturer_id')
    .eq('id', courseId)
    .single()

  const { error } = await supabase
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      status: 'pending_approval'
    })

  if (error) return { error: error.message }

  // Gửi thông báo cho giảng viên (lecturer_id) hoặc admin
  if (course) {
    const recipientIds: string[] = []
    if (course.lecturer_id) {
      recipientIds.push(course.lecturer_id)
    }
    
    // Tìm các admin trong hệ thống để thông báo
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
    
    if (admins) {
      admins.forEach((adm: any) => {
        if (!recipientIds.includes(adm.id)) {
          recipientIds.push(adm.id)
        }
      })
    }

    for (const recipientId of recipientIds) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        title: 'Yêu cầu đăng ký khóa học mới',
        message: `Học viên "${profile?.full_name || 'Ẩn danh'}" vừa gửi yêu cầu đăng ký tham gia khóa học "${course.title}".`,
        type: 'system',
        link: `/dashboard/admin/courses/${courseId}`
      })
    }
  }

  revalidatePath('/dashboard/courses')
  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: true }
}
