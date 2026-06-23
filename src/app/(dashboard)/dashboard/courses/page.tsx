import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { BookOpen, Clock, BarChart } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createClient()

  // Fetch published courses
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*, categories(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Danh mục Khóa học</h1>
        <p className="text-gray-500">Khám phá các khóa học đào tạo nhân sự chuyên nghiệp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!courses || courses.length === 0) ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            Hiện chưa có khóa học nào được xuất bản.
          </div>
        ) : (
          courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#103C11]/10 text-[#103C11]">
                    <BookOpen size={48} opacity={0.5} />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[#103C11]">
                  {course.categories?.name || 'Chung'}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.short_description || course.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{course.total_duration} phút</span>
                  </div>
                  <div className="flex items-center">
                    <BarChart size={14} className="mr-1" />
                    <span>{course.level || 'Cơ bản'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link 
                    href={`/dashboard/courses/${course.slug || course.id}`}
                    className="block w-full text-center text-sm font-bold text-white hover:bg-[#1e5c20] bg-[#103C11] py-2.5 rounded-xl transition-all shadow-md"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

