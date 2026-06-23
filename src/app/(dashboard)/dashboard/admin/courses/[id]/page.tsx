import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import CourseEditor from '@/components/admin/CourseEditor'

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Lấy thông tin khóa học cùng với modules và lessons
  // Nếu id là 'new', chúng ta sẽ tạo một khóa học trống
  let course = null
  if (id !== 'new') {
    const { data: courseData, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules (
          id,
          title,
          order_index,
          lessons (
            *,
            quizzes:lesson_quizzes (
              id,
              question,
              options,
              correct_option_index,
              explanation
            ),
            assignments (
              id,
              title,
              description,
              essay_link
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !courseData) {
      return notFound()
    }
    
    // Sắp xếp lại modules và lessons theo order_index
    course = {
      ...courseData,
      modules: (courseData.modules || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((m: any) => ({
          ...m,
          lessons: (m.lessons || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((l: any) => {
              const assignment = l.assignments?.[0]
              return {
                ...l,
                essay_title: assignment?.title || '',
                essay_description: assignment?.description || '',
                essay_link: assignment?.essay_link || '',
                quizzes: l.quizzes || []
              }
            })
        }))
    }
  }

  // 2. Lấy danh mục để hiển thị trong select
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div className="py-6">
      <CourseEditor 
        course={course} 
        categories={categories || []} 
      />
    </div>
  )
}
