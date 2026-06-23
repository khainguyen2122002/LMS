'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface QuizInput {
  id?: string
  question: string
  options: string[]
  correct_option_index: number
  explanation?: string
}

interface LessonInput {
  id: string
  title: string
  type: string
  order_index: number
  description?: string
  duration_minutes?: number
  video_url?: string
  slide_url?: string
  attachments?: any[]
  quizzes?: QuizInput[]
  essay_title?: string
  essay_description?: string
  essay_link?: string
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
  status: string
  thumbnail_url?: string
  modules: ModuleInput[]
}

async function syncLessonQuizzesAndAssignments(supabase: any, lessonId: string, lesson: LessonInput) {
  if (lessonId.startsWith('lesson-')) return // Skip mock IDs

  // 1. Sync Quizzes (MCQs)
  // Xóa toàn bộ quiz cũ của bài học này và lưu lại danh sách mới
  await supabase.from('lesson_quizzes').delete().eq('lesson_id', lessonId)
  if (lesson.quizzes && lesson.quizzes.length > 0) {
    const quizRows = lesson.quizzes.map(q => ({
      lesson_id: lessonId,
      question: q.question,
      options: q.options,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation || null
    }))
    await supabase.from('lesson_quizzes').insert(quizRows)
  }

  // 2. Sync Assignments (Tự luận)
  if (lesson.essay_link && lesson.essay_link.trim() !== '') {
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select('id')
      .eq('lesson_id', lessonId)
      .single()

    const assignmentData = {
      lesson_id: lessonId,
      title: lesson.essay_title || lesson.title || 'Bài tập tự luận',
      description: lesson.essay_description || 'Nộp bài tự luận theo yêu cầu.',
      essay_link: lesson.essay_link.trim(),
      assignment_type: 'link',
      min_passing_score: 50
    }

    if (existingAssignment) {
      await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', existingAssignment.id)
    } else {
      await supabase
        .from('assignments')
        .insert(assignmentData)
    }
  } else {
    // Nếu không có link nộp bài tự luận, tiến hành xóa assignment của bài học này
    await supabase.from('assignments').delete().eq('lesson_id', lessonId)
  }
}

export async function saveCourse(courseData: SaveCourseInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  // Verify admin/lecturer role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
    return { error: 'Không có quyền thực hiện thao tác này' }
  }

  const { modules, ...courseFields } = courseData

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
        price: 0, // Set price to 0 since we removed the field
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
        price: 0,
        status: filteredCourseFields.status,
        thumbnail_url: filteredCourseFields.thumbnail_url,
        created_by: user.id,
        lecturer_id: user.id, // Assign creator as the lecturer
      })
      .select('id')
      .single()

    if (courseError || !newCourse) return { error: courseError?.message || 'Không thể tạo khóa học' }
    courseId = newCourse.id
  }

  // Sync modules
  for (const [moduleIndex, module] of modules.entries()) {
    const isNewModule = module.id.startsWith('module-')
    let moduleId = module.id

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
      moduleId = newModule.id

      // Insert lessons for this module
      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        const { data: newLesson, error: lesError } = await supabase
          .from('lessons')
          .insert({
            module_id: moduleId,
            title: lesson.title,
            type: lesson.type,
            order_index: lessonIndex + 1,
            is_published: true,
            description: lesson.description || null,
            duration_minutes: lesson.duration_minutes || 0,
            video_url: lesson.video_url || null,
            slide_url: lesson.slide_url || null,
            attachments: lesson.attachments || [],
          })
          .select('id')
          .single()

        if (!lesError && newLesson) {
          await syncLessonQuizzesAndAssignments(supabase, newLesson.id, lesson)
        }
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

      // Sync lessons: Insert new ones or update existing
      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        const isNewLesson = lesson.id.startsWith('lesson-')
        let lessonId = lesson.id

        if (isNewLesson) {
          const { data: newLesson, error: lesError } = await supabase
            .from('lessons')
            .insert({
              module_id: moduleId,
              title: lesson.title,
              type: lesson.type,
              order_index: lessonIndex + 1,
              is_published: true,
              description: lesson.description || null,
              duration_minutes: lesson.duration_minutes || 0,
              video_url: lesson.video_url || null,
              slide_url: lesson.slide_url || null,
              attachments: lesson.attachments || [],
            })
            .select('id')
            .single()

          if (!lesError && newLesson) {
            lessonId = newLesson.id
          }
        } else {
          await supabase
            .from('lessons')
            .update({
              title: lesson.title,
              type: lesson.type,
              order_index: lessonIndex + 1,
              description: lesson.description || null,
              duration_minutes: lesson.duration_minutes || 0,
              video_url: lesson.video_url || null,
              slide_url: lesson.slide_url || null,
              attachments: lesson.attachments || [],
            })
            .eq('id', lesson.id)
        }

        await syncLessonQuizzesAndAssignments(supabase, lessonId, lesson)
      }
    }
  }

  revalidatePath('/dashboard/admin/courses')
  revalidatePath(`/dashboard/admin/courses/${courseId}`)
  return { success: true, courseId }
}
