'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface LessonInput {
  id: string
  title: string
  type: string
  order_index: number
}

interface ModuleInput {
  id: string
  title: string
  description?: string
  order_index: number
  thumbnail_url?: string
  duration_minutes?: number
  status?: string
  prerequisite_module_id?: string
  tags?: string
  internal_note?: string
  lessons: LessonInput[]
}

interface SaveCourseInput {
  id?: string
  title: string
  slug: string
  description: string
  category_id?: string
  level: string
  price: number
  status: string
  thumbnail_url?: string
  modules: ModuleInput[]
}

export async function saveCourse(courseData: SaveCourseInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
    return { error: 'Không có quyền thực hiện thao tác này' }
  }

  const { modules, ...courseFields } = courseData

  // Filter out Base64 thumbnails for storage (would need real file upload for production)
  // For now, keep URL-based thumbnails and skip base64
  const filteredCourseFields = {
    ...courseFields,
    thumbnail_url: courseFields.thumbnail_url?.startsWith('data:')
      ? '' // Skip base64 in DB (local preview only)
      : courseFields.thumbnail_url || '',
  }

  let courseId = courseData.id

  if (courseId) {
    // Update existing course
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        title: filteredCourseFields.title,
        slug: filteredCourseFields.slug,
        description: filteredCourseFields.description,
        category_id: filteredCourseFields.category_id || null,
        level: filteredCourseFields.level,
        price: Number(filteredCourseFields.price),
        status: filteredCourseFields.status,
        thumbnail_url: filteredCourseFields.thumbnail_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (courseError) return { error: courseError.message }
  } else {
    // Create new course
    const { data: newCourse, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: filteredCourseFields.title,
        slug: filteredCourseFields.slug,
        description: filteredCourseFields.description,
        category_id: filteredCourseFields.category_id || null,
        level: filteredCourseFields.level,
        price: Number(filteredCourseFields.price),
        status: filteredCourseFields.status,
        thumbnail_url: filteredCourseFields.thumbnail_url,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (courseError || !newCourse) return { error: courseError?.message || 'Không thể tạo khóa học' }
    courseId = newCourse.id
  }

  // Sync modules
  for (const [moduleIndex, module] of modules.entries()) {
    const isNewModule = module.id.startsWith('module-')

    if (isNewModule) {
      // Insert new module
      const { data: newModule, error: modError } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: module.title,
          description: module.description || null,
          order_index: module.order_index || moduleIndex + 1,
          thumbnail_url: module.thumbnail_url || null,
          duration_minutes: module.duration_minutes || null,
          status: module.status || 'published',
          prerequisite_module_id: module.prerequisite_module_id || null,
          tags: module.tags || null,
          internal_note: module.internal_note || null,
        })
        .select('id')
        .single()

      if (modError || !newModule) continue

      // Insert lessons for this module
      const moduleId = newModule.id
      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        await supabase.from('lessons').insert({
          module_id: moduleId,
          title: lesson.title,
          type: lesson.type,
          order_index: lessonIndex + 1,
          is_published: true,
        })
      }
    } else {
      // Update existing module
      await supabase
        .from('modules')
        .update({
          title: module.title,
          description: module.description || null,
          order_index: module.order_index || moduleIndex + 1,
          thumbnail_url: module.thumbnail_url || null,
          duration_minutes: module.duration_minutes || null,
          status: module.status || 'published',
          prerequisite_module_id: module.prerequisite_module_id || null,
          tags: module.tags || null,
          internal_note: module.internal_note || null,
        })
        .eq('id', module.id)

      // Sync lessons: Insert new ones
      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        const isNewLesson = lesson.id.startsWith('lesson-')
        if (isNewLesson) {
          await supabase.from('lessons').insert({
            module_id: module.id,
            title: lesson.title,
            type: lesson.type,
            order_index: lessonIndex + 1,
            is_published: true,
          })
        } else {
          await supabase.from('lessons').update({
            title: lesson.title,
            type: lesson.type,
            order_index: lessonIndex + 1,
          }).eq('id', lesson.id)
        }
      }
    }
  }

  revalidatePath('/dashboard/admin/courses')
  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true, courseId }
}
