import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, Users, CheckCircle, Clock, BookOpen, Search, Filter, Download, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function CourseProgressPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Kiểm tra quyền Admin/Lecturer
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
    redirect('/dashboard')
  }

  // 2. Lấy thông tin khóa học và học viên
  const { data: course } = await supabase
    .from('courses')
    .select('title, id')
    .eq('id', id)
    .single()

  if (!course) return notFound()

  // 3. Lấy danh sách học viên và tiến độ
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      progress_percentage,
      status,
      enrolled_at,
      profile:profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('course_id', id)
    .order('enrolled_at', { ascending: false })

  // 4. Lấy danh sách bài học để làm header bảng hoặc filter
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, type')
    .filter('module_id', 'in', (
        supabase.from('modules').select('id').eq('course_id', id)
    ))

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href={`/dashboard/admin/courses/${id}`}
              className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-[#103C11] transition-all hover:shadow-md"
            >
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Quản lý tiến độ</h1>
              <p className="text-gray-500 font-medium">{course.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={20} />
              Xuất báo cáo
            </button>
            <button className="flex items-center gap-2 bg-[#103C11] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1e5c20] transition-all shadow-lg shadow-[#103C11]/20">
              <Users size={20} />
              Mời học viên
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tổng học viên</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{enrollments?.length || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle size={20} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Hoàn thành</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {enrollments?.filter((e: any) => e.progress_percentage === 100).length || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-[#C7A959]/10 text-[#C7A959] rounded-lg flex items-center justify-center mb-4">
              <Clock size={20} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Đang học</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {enrollments?.filter((e: any) => e.progress_percentage > 0 && e.progress_percentage < 100).length || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center mb-4">
              <BookOpen size={20} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bài học trực tuyến</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {lessons?.filter((l: any) => l.type === 'live_class').length || 0}
            </h3>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm học viên..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#103C11]/10 outline-none font-medium transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800">
                <Filter size={18} />
                Lọc dữ liệu
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Học viên</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày tham gia</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiến độ</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enrollments && enrollments.length > 0 ? enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#103C11] flex items-center justify-center text-white font-black text-sm overflow-hidden">
                          {enrollment.profile.avatar_url ? (
                            <img src={enrollment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            enrollment.profile.full_name?.charAt(0) || enrollment.profile.email.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{enrollment.profile.full_name || 'Chưa cập nhật'}</p>
                          <p className="text-xs text-gray-400 font-medium">{enrollment.profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-600">
                        {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              enrollment.progress_percentage === 100 ? 'bg-green-500' : 'bg-[#C7A959]'
                            }`}
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-black text-gray-700">{enrollment.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        enrollment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {enrollment.status === 'active' ? 'Đang học' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-[#103C11] transition-colors">
                        <ArrowRight size={20} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                      Chưa có học viên nào tham gia khóa học này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
