import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, BookOpen, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, company')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'pending'

  if (role === 'pending') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-yellow-200 bg-yellow-50/30">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tài khoản đang chờ duyệt</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Cảm ơn <strong>{profile?.full_name}</strong> đã đăng ký. 
          Tài khoản của bạn hiện đang được ban quản trị xét duyệt để đảm bảo trải nghiệm tốt nhất cho doanh nghiệp. 
          Vui lòng quay lại sau hoặc liên hệ hỗ trợ.
        </p>
      </div>
    )
  }

  // Dashboard for Admin/Student/Lecturer
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Xin chào, {profile?.full_name}!</h1>
        <p className="text-gray-500">Chào mừng trở lại Hệ thống Đào tạo Inspiring HR.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Khóa học của tôi</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-[#C7A959] flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Giờ học tập</p>
            <p className="text-2xl font-bold text-gray-800">0h</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động gần đây</h3>
        <div className="text-center py-10 text-gray-500">
          Chưa có hoạt động nào được ghi nhận.
        </div>
      </div>
    </div>
  )
}

