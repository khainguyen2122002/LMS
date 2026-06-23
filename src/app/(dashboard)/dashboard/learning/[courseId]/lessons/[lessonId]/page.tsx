import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import LessonClient from '@/components/lessons/LessonClient'
import PreviewModeToggle from '@/components/admin/PreviewModeToggle'

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { courseId, lessonId } = await params
  const { preview } = await searchParams
  const isPreview = preview === 'true'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Lấy thông tin bài học (bao gồm quizzes và assignments)
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      *,
      quizzes:lesson_quizzes (*),
      assignments:assignments (*),
      module:modules (
        id,
        title,
        course:courses (
          id,
          title
        )
      )
    `)
    .eq('id', lessonId)
    .single()

  if (error || !lesson) return notFound()

  // 2. Kiểm tra quyền truy cập (Enrollment) & Lấy tiến độ + Bài làm
  let progress = null
  let isCompleted = false
  let submission = null

  if (!isPreview) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (!enrollment) {
      // Cho phép Admin/Lecturer xem mà không cần enroll
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
        redirect(`/dashboard/courses/${courseId}`)
      }
    } else {
      // Lấy tiến độ hiện tại
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('lesson_id', lessonId)
        .single()
      
      progress = progressData
      isCompleted = !!progressData?.is_completed

      // Lấy bài làm nếu đây là loại bài tập
      if (lesson.type === 'assignment' && lesson.assignments?.length > 0) {
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', lesson.assignments[0].id)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single()
        
        submission = submissionData
      }
    }
  }

  // 3. Lấy bài học trước và sau để điều hướng
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, order_index, module_id')
    .eq('module_id', lesson.module_id)
    .order('order_index', { ascending: true })

  const currentIndex = allLessons?.findIndex((l: any) => l.id === lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <LessonClient 
        lesson={lesson} 
        courseId={courseId} 
        isCompleted={isCompleted}
        progress={progress}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        submission={submission}
      />
      
      {/* Preview Mode Toggle cho Admin/Lecturer */}
      <PreviewModeToggle />
    </div>
  )
}
