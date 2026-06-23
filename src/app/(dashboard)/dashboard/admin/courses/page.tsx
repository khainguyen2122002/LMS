import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  // Lấy danh sách tất cả các khóa học
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1>
          <p className="text-gray-500">Tạo, chỉnh sửa và quản lý nội dung đào tạo của bạn.</p>
        </div>
        <Link
          href="/dashboard/admin/courses/new"
          className="flex items-center justify-center gap-2 bg-[#103C11] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#1e5c20] transition-all shadow-md"
        >
          <Plus size={20} />
          Thêm khóa học mới
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Khóa học</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Danh mục</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Giá</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!courses || courses.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen size={40} className="text-gray-300" />
                      <p>Chưa có khóa học nào. Hãy bắt đầu bằng cách thêm khóa học mới!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course: any) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <BookOpen size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{course.title}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{course.level || 'Cơ bản'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                        {course.categories?.name || 'Chung'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#C7A959]">
                      {course.price > 0 ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        course.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : course.status === 'closed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {course.status === 'published' ? 'Đã xuất bản' : course.status === 'closed' ? 'Đã đóng' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/dashboard/learning/${course.id}?preview=true`}
                          className="p-2 text-gray-400 hover:text-[#C7A959] transition-colors"
                          title="Xem trước"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/dashboard/admin/courses/${course.id}`}
                          className="p-2 text-gray-400 hover:text-[#103C11] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

