import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, BarChart, ChevronRight, CheckCircle2, Play, ArrowLeft, ShieldCheck, Award } from 'lucide-react'
import { enrollInCourse } from '@/app/actions/lessons'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('id', id)
    .single()

  let finalCourse = course
  if (!course) {
    const { data: courseBySlug } = await supabase
      .from('courses')
      .select('title, description')
      .eq('slug', id)
      .single()
    finalCourse = courseBySlug
  }

  return {
    title: finalCourse ? `${finalCourse.title} - Inspiring HR LMS` : 'Khóa học',
    description: finalCourse?.description || 'Chi tiết khóa học đào tạo nhân sự'
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  let finalCourse = course
  if (courseError || !course) {
    const { data: courseBySlug } = await supabase
      .from('courses')
      .select('*, categories(name)')
      .eq('slug', id)
      .single()
    finalCourse = courseBySlug
  }

  if (!finalCourse) return notFound()

  // 2. Check if user is enrolled
  const { data: { user } } = await supabase.auth.getUser()
  let isEnrolled = false
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', finalCourse.id)
      .single()
    isEnrolled = !!enrollment
  }

  // 3. Fetch modules and lessons
  const { data: modulesData } = await supabase
    .from('modules')
    .select(`
      id, title,
      lessons (
        id, title, type, duration_minutes
      )
    `)
    .eq('course_id', finalCourse.id)
    .order('order_index')

  const modules = modulesData?.map((m: any) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      duration_minutes: l.duration_minutes
    }))
  })) || []

  const firstLessonId = modules[0]?.lessons[0]?.id

  const handleEnroll = async () => {
    'use server'
    const res = await enrollInCourse(finalCourse.id)
    if (res.success && firstLessonId) {
      redirect(`/dashboard/learning/${finalCourse.id}/lessons/${firstLessonId}`)
    }
  }

  const totalLessons = modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)

  return (
    <div className="space-y-8 pb-12">
      {/* Nút Quay Lại */}
      <div>
        <Link 
          href="/dashboard/courses" 
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#103C11] transition-colors gap-2"
          id="btn-back-courses"
        >
          <ArrowLeft size={16} />
          Quay lại danh mục khóa học
        </Link>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột Trái: Thông tin chi tiết */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Banner Cover với thiết kế kính mờ Glassmorphism */}
            <div className="h-64 bg-gradient-to-br from-[#103C11] to-[#1e5c20] p-8 relative flex flex-col justify-end text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7A959]/10 rounded-full blur-3xl -z-0"></div>
              <span className="bg-[#C7A959] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider w-max mb-4 z-10 shadow-lg shadow-[#C7A959]/20">
                {finalCourse.categories?.name || 'Chung'}
              </span>
              <h1 className="text-3xl font-black z-10 leading-tight mb-2">{finalCourse.title}</h1>
              <p className="text-white/80 text-sm max-w-2xl z-10 font-medium line-clamp-2">{finalCourse.short_description}</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Mô tả khóa học */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 border-l-4 border-[#103C11] pl-3">Giới thiệu Khóa học</h2>
                <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{finalCourse.description}</p>
              </div>

              {/* Lợi ích khóa học */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Award className="text-[#C7A959]" size={20} />
                  Giá trị bạn nhận được sau khóa học
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Nắm vững quy trình nghiệp vụ thực tế',
                    'Nâng cao hiệu suất xử lý công việc',
                    'Sử dụng thành thạo các biểu mẫu liên quan',
                    'Được cấp chứng nhận hoàn thành khóa học'
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 font-medium">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lộ trình học tập */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 border-l-4 border-[#103C11] pl-3">Nội dung Chương trình</h2>
                {modules.length === 0 ? (
                  <p className="text-gray-500 text-sm">Chương trình học đang được cập nhật.</p>
                ) : (
                  <div className="space-y-4">
                    {modules.map((mod: any, i: number) => (
                      <div key={mod.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                          <h4 className="font-bold text-gray-800 text-sm md:text-base flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#103C11]/10 text-[#103C11] rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            {mod.title}
                          </h4>
                          <span className="text-xs font-bold text-gray-400">
                            {mod.lessons.length} bài học
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {mod.lessons.map((lesson: any) => (
                            <div key={lesson.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-sm font-medium">
                              <span className="text-gray-700 flex items-center gap-2">
                                <BookOpen size={16} className="text-gray-400 shrink-0" />
                                {lesson.title}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-2 shrink-0">
                                <Clock size={12} />
                                {lesson.duration_minutes} phút
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Thẻ Đăng ký học (Sticky) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Thông tin khóa học</h3>
            
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center text-gray-500">
                <span>Cấp độ:</span>
                <span className="text-gray-900 font-bold">{finalCourse.level || 'Cơ bản'}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Tổng số bài học:</span>
                <span className="text-gray-900 font-bold">{totalLessons} bài học</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Tổng thời lượng:</span>
                <span className="text-gray-900 font-bold">{finalCourse.total_duration} phút</span>
              </div>

            </div>

            {/* Form Hành động (Đăng ký học / Vào học) */}
            <div>
              {isEnrolled ? (
                firstLessonId ? (
                  <Link 
                    href={`/dashboard/learning/${finalCourse.id}/lessons/${firstLessonId}`}
                    className="w-full py-4 px-6 bg-[#103C11] hover:bg-[#1e5c20] text-white rounded-2xl font-black text-center shadow-lg shadow-[#103C11]/20 transition-all flex items-center justify-center gap-2 active:scale-95 group"
                    id="btn-continue-learning"
                  >
                    Tiếp tục học
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <button 
                    disabled 
                    className="w-full py-4 px-6 bg-gray-200 text-gray-400 rounded-2xl font-bold cursor-not-allowed text-center"
                    id="btn-no-lessons"
                  >
                    Đã đăng ký (Chưa có bài học)
                  </button>
                )
              ) : (
                <form action={handleEnroll}>
                  <button 
                    type="submit"
                    className="w-full py-4 px-6 bg-[#C7A959] hover:bg-[#d99700] text-white rounded-2xl font-black text-center shadow-lg shadow-[#C7A959]/20 transition-all flex items-center justify-center gap-2 active:scale-95 group"
                    id="btn-enroll-course"
                  >
                    <Play size={18} fill="currentColor" />
                    Đăng ký & Bắt đầu học
                  </button>
                </form>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-green-500" />
              Học tập an toàn & bảo mật
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
