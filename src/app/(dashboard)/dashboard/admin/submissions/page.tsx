import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function AdminSubmissionsPage() {
  const supabase = await createClient()

  // 1. Kiểm tra quyền truy cập (Admin/Lecturer)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
    redirect('/dashboard')
  }

  // 2. Truy vấn danh sách bài nộp từ học viên
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      id,
      submitted_at,
      status,
      score,
      student_note,
      attachment_url,
      assignment:assignments (
        title,
        assignment_type
      ),
      student:profiles!user_id (
        full_name,
        email
      )
    `)
    .order('submitted_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit"><CheckCircle2 size={12} /> Đạt (Passed)</span>
      case 'failed':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit"><XCircle size={12} /> Chưa đạt (Failed)</span>
      case 'grading':
        return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit"><Clock size={12} /> Đang chấm</span>
      default:
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit"><Clock size={12} /> Mới nộp</span>
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Bài nộp</h1>
        <p className="text-gray-500">Xem và đánh giá các bài tập tự luận, bài thu hoạch từ học viên.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Học viên</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Bài tập</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Ngày nộp</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Điểm số</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!submissions || submissions.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={40} className="text-gray-300" />
                      <p>Chưa có học viên nào nộp bài tập tự luận.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{sub.student?.full_name || 'Học viên ẩn'}</p>
                        <p className="text-xs text-gray-400">{sub.student?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-800 line-clamp-1">{sub.assignment?.title || 'Bài tập tự luận'}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Hình thức: Nộp qua link</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 font-bold text-base text-gray-800">
                      {sub.score !== null ? `${sub.score} / 100` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/admin/submissions/${sub.id}`}
                        className="inline-flex items-center gap-1.5 bg-[#103C11] text-white hover:bg-[#1e5c20] px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm group-hover:shadow-md"
                      >
                        <Eye size={14} />
                        Xem & Chấm điểm
                      </Link>
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
