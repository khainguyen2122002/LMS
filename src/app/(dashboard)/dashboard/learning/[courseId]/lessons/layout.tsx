import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CourseSidebar from '@/components/lessons/CourseSidebar'

export default async function CourseLearningLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) {
    redirect('/dashboard/courses') // Not enrolled
  }

  // Fetch modules and lessons
  const { data: modulesData } = await supabase
    .from('modules')
    .select(`
      id, title,
      lessons (
        id, title, type, duration_minutes,
        lesson_progress (is_completed)
      )
    `)
    .eq('course_id', courseId)
    .order('order_index')

  // Format data for sidebar
  const modules = modulesData?.map((m: any) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      duration_minutes: l.duration_minutes,
      is_completed: l.lesson_progress?.length > 0 ? l.lesson_progress[0].is_completed : false
    }))
  })) || []

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      <CourseSidebar courseId={courseId} modules={modules} />
      {children}
    </div>
  )
}
