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
            id,
            title,
            type,
            order_index
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
      modules: courseData.modules
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((m: any) => ({
          ...m,
          lessons: m.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
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
