'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  Lock, 
  Loader2, 
  Download, 
  Clock, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react'
import { 
  getCourseEnrollments, 
  approveEnrollment, 
  rejectEnrollment, 
  enrollStudentByAdmin, 
  removeStudentFromCourse, 
  getAllStudents 
} from '@/app/actions/enrollments'
import LessonAccessModal from './LessonAccessModal'

interface CourseStudentManagerProps {
  courseId: string
  modules: any[]
}

export default function CourseStudentManager({ courseId, modules }: CourseStudentManagerProps) {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [systemStudents, setSystemStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  
  // States for Lesson Access Modal
  const [activeEnrollment, setActiveEnrollment] = useState<any | null>(null)

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    setLoading(true)
    const res = await getCourseEnrollments(courseId)
    const stdRes = await getAllStudents()

    if (res.data) setEnrollments(res.data)
    if (stdRes.data) setSystemStudents(stdRes.data)
    setLoading(false)
  }

  // Phê duyệt đăng ký
  const handleApprove = async (enrollId: string) => {
    if (!confirm('Duyệt cho học viên này tham gia khóa học?')) return
    const res = await approveEnrollment(enrollId, courseId)
    if (res.success) {
      setEnrollments(prev =>
        prev.map(e => (e.id === enrollId ? { ...e, status: 'active', enrolled_at: new Date().toISOString() } : e))
      )
    } else {
      alert(res.error)
    }
  }

  // Từ chối đăng ký
  const handleReject = async (enrollId: string) => {
    if (!confirm('Từ chối yêu cầu tham gia của học viên này?')) return
    const res = await rejectEnrollment(enrollId, courseId)
    if (res.success) {
      setEnrollments(prev =>
        prev.map(e => (e.id === enrollId ? { ...e, status: 'rejected' } : e))
      )
    } else {
      alert(res.error)
    }
  }

  // Xóa học viên khỏi lớp
  const handleRemove = async (enrollId: string, name: string) => {
    if (!confirm(`Xóa học viên "${name}" ra khỏi khóa học này? Dữ liệu tiến độ học tập sẽ bị xóa bỏ hoàn toàn.`)) return
    const res = await removeStudentFromCourse(enrollId, courseId)
    if (res.success) {
      setEnrollments(prev => prev.filter(e => e.id !== enrollId))
    } else {
      alert(res.error)
    }
  }

  // Thêm trực tiếp học viên vào khóa học
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return

    setEnrolling(true)
    const res = await enrollStudentByAdmin(courseId, selectedStudentId)
    setEnrolling(false)

    if (res.error) {
      alert(res.error)
    } else {
      setSelectedStudentId('')
      fetchData() // Tải lại danh sách
    }
  }

  // Cập nhật danh sách chặn bài học sau khi đóng Modal
  const handleAccessSaved = (enrollId: string, updatedBlocked: string[]) => {
    setEnrollments(prev =>
      prev.map(e => (e.id === enrollId ? { ...e, blocked_lessons: updatedBlocked } : e))
    )
  }

  // Tải danh sách học viên (Xuất CSV local)
  const handleExportCSV = () => {
    if (enrollments.length === 0) return

    const headers = 'Họ tên,Email,Ngày tham gia,Tiến độ (%),Trạng thái\n'
    const rows = enrollments.map(e => {
      const name = e.student?.full_name || 'N/A'
      const email = e.student?.email || 'N/A'
      const date = e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('vi-VN') : '—'
      const progress = e.progress_percentage || 0
      const statusText = e.status === 'active' ? 'Đang học' : e.status === 'pending_approval' ? 'Chờ duyệt' : e.status === 'rejected' ? 'Từ chối' : e.status
      return `"${name}","${email}","${date}",${progress},"${statusText}"`
    }).join('\n')

    // Tạo file download
    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `DanhSachHocVien_KhoaHoc_${courseId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Phân loại học viên
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending_approval')
  const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'completed')

  // Lọc danh sách học viên có thể thêm (những người chưa đăng ký học khóa này)
  const filterAvailableStudents = () => {
    return systemStudents.filter(s => !enrollments.some(e => e.student?.id === s.id))
  }

  const availableStudents = filterAvailableStudents()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="animate-spin text-[#103C11] mb-2" size={32} />
        <p className="text-sm font-medium">Đang tải danh sách học viên...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 1. Form thêm học viên trực tiếp */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
          <Users size={16} className="text-[#103C11]" />
          Thêm học viên trực tiếp vào khóa học này
        </h3>
        
        <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-gray-500">Chọn học viên từ hệ thống</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-xs bg-white"
              required
            >
              <option value="">-- Chọn học viên --</option>
              {availableStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={enrolling || !selectedStudentId}
            className="px-6 py-3 bg-[#103C11] hover:bg-[#1e5c20] text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1"
          >
            {enrolling ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Thêm vào lớp
          </button>
        </form>
      </div>

      {/* 2. Danh sách Đăng ký chờ duyệt */}
      {pendingEnrollments.length > 0 && (
        <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm overflow-hidden">
          <div className="bg-yellow-50/50 px-6 py-4 border-b border-yellow-100 flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-600 shrink-0" />
            <h3 className="font-bold text-yellow-800 text-sm">Yêu cầu đăng ký học chờ duyệt ({pendingEnrollments.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 font-semibold text-gray-500">Học viên</th>
                  <th className="px-6 py-3 font-semibold text-gray-500">Ngày yêu cầu</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pendingEnrollments.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-bold text-gray-800">{sub.student?.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{sub.student?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(sub.enrolled_at || sub.created_at || Date.now()).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(sub.id)}
                          className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 transition-colors rounded-lg font-bold flex items-center gap-0.5"
                          title="Phê duyệt"
                        >
                          <Check size={14} /> Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(sub.id)}
                          className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-lg font-bold flex items-center gap-0.5"
                          title="Từ chối"
                        >
                          <X size={14} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Danh sách học viên chính thức trong khóa học */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">Danh sách học viên trong lớp ({activeEnrollments.length})</h3>
          {activeEnrollments.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-bold text-[#103C11] hover:underline"
            >
              <Download size={14} />
              Tải danh sách Excel (CSV)
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 font-semibold text-gray-600">Học viên</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Ngày gia nhập</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Tiến độ (%)</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Phân quyền bài học</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {activeEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                    Chưa có học viên nào trong lớp.
                  </td>
                </tr>
              ) : (
                activeEnrollments.map((sub: any) => {
                  const blockedCount = sub.blocked_lessons?.length || 0

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{sub.student?.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{sub.student?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {sub.enrolled_at ? new Date(sub.enrolled_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#103C11] w-8 shrink-0">{Math.round(sub.progress_percentage || 0)}%</span>
                          <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div 
                              className="bg-[#C7A959] h-full rounded-full"
                              style={{ width: `${sub.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setActiveEnrollment(sub)}
                          className={`flex items-center gap-1 font-bold px-2.5 py-1.5 rounded-lg border transition-all text-[11px] ${
                            blockedCount > 0 
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          <Lock size={12} />
                          {blockedCount > 0 ? `Đã chặn ${blockedCount} bài học` : 'Cấp quyền truy cập'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(sub.id, sub.student?.full_name)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa học viên khỏi lớp"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lesson Access Modal Component */}
      {activeEnrollment && (
        <LessonAccessModal
          enrollment={activeEnrollment}
          courseId={courseId}
          modules={modules}
          onClose={() => setActiveEnrollment(null)}
          onSuccess={(updatedBlocked) => handleAccessSaved(activeEnrollment.id, updatedBlocked)}
        />
      )}
    </div>
  )
}
