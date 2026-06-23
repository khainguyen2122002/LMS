'use client'

import React, { useState } from 'react'
import { Upload, Link as LinkIcon, FileText, Send, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { submitAssignment } from '@/app/actions/assignments'

interface AssignmentSubmissionProps {
  assignment: {
    id: string
    title: string
    description: string
    due_date: string
    assignment_type: 'file' | 'link' | 'text'
    min_passing_score: number
  }
  submission?: any
  courseId: string
  lessonId: string
}

export default function AssignmentSubmission({ assignment, submission: initialSubmission, courseId, lessonId }: AssignmentSubmissionProps) {
  const [submission, setSubmission] = useState(initialSubmission)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const isExpired = assignment.due_date ? new Date(assignment.due_date) < new Date() : false

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate SharePoint upload and DB update
    const formData = new FormData()
    formData.append('assignmentId', assignment.id)
    formData.append('courseId', courseId)
    formData.append('lessonId', lessonId)
    formData.append('type', assignment.assignment_type)
    
    if (assignment.assignment_type === 'file' && file) {
      formData.append('file', file)
    } else {
      formData.append('content', content)
    }

    const res = await submitAssignment(formData)
    if (res.success) {
      setSubmission(res.data)
      alert('Nộp bài thành công!')
    } else {
      alert(res.error || 'Có lỗi xảy ra')
    }
    setIsSubmitting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50 border-green-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      case 'grading': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'passed': return 'Đã đạt'
      case 'failed': return 'Không đạt'
      case 'grading': return 'Đang chấm'
      default: return 'Đã nộp bài'
    }
  }

  if (submission && submission.status !== 'failed') {
    return (
      <div className={`p-8 rounded-2xl border-2 ${getStatusColor(submission.status)}`}>
        <div className="flex items-center gap-4 mb-4">
          <CheckCircle2 size={32} />
          <div>
            <h3 className="text-xl font-bold">Trạng thái bài tập: {getStatusLabel(submission.status)}</h3>
            <p className="text-sm opacity-80">Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}</p>
          </div>
        </div>
        
        {submission.score !== null && (
          <div className="mt-6 p-4 bg-white/50 rounded-xl">
            <p className="text-sm font-bold uppercase tracking-widest opacity-60">Điểm số</p>
            <p className="text-3xl font-black">{submission.score} / 100</p>
            {submission.feedback && (
              <div className="mt-4 pt-4 border-t border-black/5">
                <p className="text-sm font-bold mb-1">Nhận xét của giảng viên:</p>
                <p className="text-sm italic">"{submission.feedback}"</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {submission.attachment_url && (
            <a 
              href={submission.attachment_url} 
              target="_blank" 
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all"
            >
              <ExternalLink size={16} />
              Xem bài đã nộp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#103C11] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#103C11]/20">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Nộp bài tập</h3>
              <p className="text-xs text-gray-500 font-medium">Yêu cầu: {assignment.assignment_type?.toUpperCase() || 'N/A'}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${isExpired ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
            <Clock size={16} />
            Hạn nộp: {assignment.due_date ? new Date(assignment.due_date).toLocaleString('vi-VN') : 'Không giới hạn'}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="prose prose-sm max-w-none text-gray-600 italic">
          <AlertCircle size={16} className="inline mr-2 mb-1" />
          {assignment.description || 'Vui lòng đọc kỹ yêu cầu trước khi nộp bài.'}
        </div>

        <div className="space-y-4">
          {assignment.assignment_type === 'file' && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-[#103C11] hover:bg-gray-50 transition-all cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload size={48} className="text-gray-300" />
              <div className="text-center">
                <p className="font-bold text-gray-700">{file ? file.name : 'Nhấn để chọn file hoặc kéo thả vào đây'}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel hoặc ZIP (Tối đa 25MB)</p>
              </div>
            </div>
          )}

          {assignment.assignment_type === 'link' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Đường dẫn bài làm (OneDrive/SharePoint/GitHub...)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="url" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#103C11]/10 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {assignment.assignment_type === 'text' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Nội dung bài làm</label>
              <textarea 
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung bài làm của bạn tại đây..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#103C11]/10 outline-none transition-all resize-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-4">
        {submission?.status === 'failed' && (
          <p className="text-xs font-bold text-red-500 mr-auto flex items-center gap-1">
            <AlertCircle size={14} />
            Bạn chưa đạt ở lần nộp trước. Hãy nộp lại bài!
          </p>
        )}
        
        <button
          disabled={isSubmitting || isExpired || (assignment.assignment_type === 'file' ? !file : !content)}
          onClick={handleSubmit}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all shadow-lg ${
            !isExpired && (assignment.assignment_type === 'file' ? file : content)
              ? 'bg-[#C7A959] text-white hover:bg-[#d99700] hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? 'Đang nộp bài...' : (
            <>
              <Send size={18} />
              {submission?.status === 'failed' ? 'Nộp lại bài' : 'Nộp bài ngay'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

