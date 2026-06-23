import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, BarChart, ChevronRight } from 'lucide-react'

export default async function MyCoursesPage() {
  const supabase = await createClient()

  // 1. Kiểm tra đăng nhập
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Lấy danh sách đăng ký học của học viên
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      progress_percentage,
      status,
      course:courses (
        id,
        title,
        description,
        short_description,
        thumbnail_url,
        total_duration,
        level,
        categories:categories(name)
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  // 3. Với mỗi khóa học, lấy bài học đầu tiên để làm link học tiếp
  const enrollmentsWithLinks = await Promise.all(
    (enrollments || []).map(async (enrollment: any) => {
      const course = enrollment.course
      if (!course) return { ...enrollment, firstLessonId: null }

      // Lấy danh sách modules sắp xếp theo order_index
      const { data: modules } = await supabase
        .from('modules')
        .select(`
          id,
          lessons(id, order_index)
        `)
        .eq('course_id', course.id)
        .order('order_index', { ascending: true })

      if (!modules || modules.length === 0) {
        return { ...enrollment, firstLessonId: null }
      }

      // Sắp xếp lessons trong module đầu tiên
      const firstModuleLessons = (modules[0].lessons || []).sort(
        (a: any, b: any) => a.order_index - b.order_index
      )

      const firstLessonId = firstModuleLessons[0]?.id || null

      return {
        ...enrollment,
        firstLessonId
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Khóa học của tôi</h1>
        <p className="text-gray-500">Tiếp tục chặng đường nâng cao năng lực nhân sự của bạn.</p>
      </div>

      {enrollmentsWithLinks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-[#e6f0e7] text-[#103C11] rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa đăng ký khóa học nào</h3>
          <p className="text-sm text-gray-500 mb-6">Bạn chưa tham gia khóa học đào tạo nào của Inspiring HR.</p>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-1.5 bg-[#103C11] text-white hover:bg-[#1e5c20] px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
          >
            Khám phá danh mục khóa học
            <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollmentsWithLinks.map((enroll: any) => {
            const course = enroll.course
            if (!course) return null

            return (
              <div key={enroll.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="h-44 bg-gray-100 relative shrink-0">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#103C11]/10 text-[#103C11]">
                      <BookOpen size={40} opacity={0.5} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-[#103C11] uppercase tracking-wider">
                    {course.categories?.name || 'Chung'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-base text-gray-900 mb-1.5 line-clamp-2 min-h-[48px]">{course.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{course.short_description || course.description}</p>
                  
                  {/* Progress Section */}
                  <div className="space-y-1.5 mb-5 pt-3 border-t border-gray-50">
                    <div className="flex justify-between text-xs font-bold text-[#103C11]">
                      <span>Tiến độ học tập</span>
                      <span>{Math.round(enroll.progress_percentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#C7A959] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${enroll.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-4">
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1 text-gray-300" />
                      <span>{course.total_duration} phút</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart size={12} className="mr-1 text-gray-300" />
                      <span>{course.level || 'Cơ bản'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                    {enroll.firstLessonId ? (
                      <Link 
                        href={`/dashboard/learning/${course.id}/lessons/${enroll.firstLessonId}`}
                        className="w-full text-center text-xs font-black text-white hover:bg-[#1e5c20] bg-[#103C11] py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 group active:scale-95"
                      >
                        Tiếp tục học
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="w-full text-center text-xs font-bold text-gray-400 bg-gray-100 py-2.5 rounded-xl cursor-not-allowed"
                      >
                        Chưa có bài học
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
