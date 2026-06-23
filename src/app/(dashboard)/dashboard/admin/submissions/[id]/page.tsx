import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, CheckCircle, XCircle, Clock, User, FileText, Send, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { gradeSubmission } from '@/app/actions/assignments'

export default async function GradingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Kiểm tra quyền Admin/Lecturer
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'lecturer') {
    redirect('/dashboard')
  }

  // 2. Lấy thông tin bài nộp
  const { data: submission, error } = await supabase
    .from('submissions')
    .select(`
      *,
      assignment:assignments (
        title,
        description,
        min_passing_score
      ),
      student:profiles!user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !submission) return notFound()

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/admin/submissions" 
            className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-[#103C11] transition-all"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-gray-900">Chấm bài: {submission.assignment.title}</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Học viên: {submission.student.full_name}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
          submission.status === 'passed' ? 'bg-green-100 text-green-700' : 
          submission.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {submission.status === 'passed' ? 'Đã đạt' : 
           submission.status === 'failed' ? 'Không đạt' : 'Chưa chấm'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Submission Preview */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                  <FileText size={18} />
                  Nội dung bài nộp
                </div>
                {submission.attachment_url && (
                  <a 
                    href={submission.attachment_url} 
                    target="_blank" 
                    className="flex items-center gap-2 text-xs font-black text-[#103C11] hover:underline"
                  >
                    Mở trong cửa sổ mới
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              
              <div className="flex-1 p-0 flex flex-col">
                {submission.sharepoint_path ? (
                  <iframe 
                    src={submission.attachment_url} 
                    className="w-full flex-1 min-h-[600px]"
                    frameBorder="0"
                  ></iframe>
                ) : submission.student_note ? (
                  <div className="p-8 prose max-w-none">
                    <p className="whitespace-pre-wrap">{submission.student_note}</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
                    <AlertCircle size={48} className="mb-4 opacity-20" />
                    <p>Không có nội dung hiển thị trực tiếp.</p>
                    <a href={submission.attachment_url} target="_blank" className="text-[#103C11] font-bold mt-2">Tải file về</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Grading Form */}
        <div className="w-96 bg-white overflow-y-auto p-6 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
          <h2 className="text-xl font-black text-gray-900 mb-8">Thông tin chấm điểm</h2>
          
          <form action={async (formData) => {
            'use server'
            const score = parseInt(formData.get('score') as string)
            const feedback = formData.get('feedback') as string
            const status = score >= (submission.assignment.min_passing_score || 50) ? 'passed' : 'failed'
            
            await gradeSubmission(id, score, feedback, status)
            redirect('/dashboard/admin/submissions')
          }} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Điểm số (0-100)</label>
              <input 
                type="number" 
                name="score"
                min="0"
                max="100"
                defaultValue={submission.score || ''}
                required
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-black text-[#C7A959] focus:ring-2 focus:ring-[#C7A959]/20 outline-none transition-all"
                placeholder="0"
              />
              <p className="text-[10px] text-gray-400 font-bold uppercase italic">Điểm đạt tối thiểu: {submission.assignment.min_passing_score || 50}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Nhận xét (Feedback)</label>
              <textarea 
                name="feedback"
                rows={10}
                defaultValue={submission.feedback || ''}
                placeholder="Nhập nhận xét chi tiết cho học viên..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#103C11]/10 outline-none transition-all resize-none"
              />
            </div>

            <div className="pt-6 space-y-3">
              <button 
                type="submit"
                className="w-full py-4 bg-[#103C11] text-white rounded-2xl font-black text-lg hover:bg-[#1e5c20] transition-all shadow-xl shadow-[#103C11]/20 flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Lưu kết quả & Thông báo
              </button>
              
              <p className="text-center text-[10px] text-gray-400 font-medium">
                Khi lưu, hệ thống sẽ tự động cập nhật tiến độ học tập và gửi thông báo cho học viên qua email & in-app.
              </p>
            </div>
          </form>

          {/* Student Profile Card */}
          <div className="mt-12 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#103C11] font-black shadow-sm overflow-hidden border border-gray-200">
              {submission.student.avatar_url ? (
                <img src={submission.student.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                submission.student.full_name?.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">{submission.student.full_name}</p>
              <p className="text-[10px] text-gray-400">{submission.student.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
