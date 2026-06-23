'use client'

import React, { useState, useEffect } from 'react'
import { markLessonComplete, updateLessonProgress } from '@/app/actions/lessons'
import { submitAssignment } from '@/app/actions/assignments'
import { 
  CheckCircle, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  BookOpen, 
  Video as VideoIcon, 
  FileText, 
  Award, 
  File, 
  ArrowRight,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import VideoPlayer from './VideoPlayer'
import CheckpointQuiz from './CheckpointQuiz'

interface LessonClientProps {
  lesson: any
  courseId: string
  isCompleted: boolean
  progress?: any
  prevLesson?: any
  nextLesson?: any
  submission?: any // Bài làm hiện tại của học viên
}

export default function LessonClient({ 
  lesson, 
  courseId, 
  isCompleted: initialCompleted, 
  progress, 
  prevLesson, 
  nextLesson, 
  submission: initialSubmission 
}: LessonClientProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'assessments' | 'attachments'>('content')
  const [contentMode, setContentMode] = useState<'video' | 'slide'>('video')
  
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [watchTime, setWatchTime] = useState(progress?.watch_time_seconds || 0)
  
  // Trắc nghiệm & Tự luận
  const [quizSuccess, setQuizSuccess] = useState(false)
  const [submission, setSubmission] = useState(initialSubmission)
  const [submittingEssay, setSubmittingEssay] = useState(false)

  // Default content mode to slide if video_url is empty but slide_url exists
  useEffect(() => {
    if (!lesson.video_url && lesson.slide_url) {
      setContentMode('slide')
    }
  }, [lesson])

  // 1. Logic theo dõi thời gian video (chỉ chạy nếu bài học có video và chưa hoàn thành)
  useEffect(() => {
    if (isCompleted || !lesson.video_url || lesson.completion_criteria !== 'view') return

    const interval = setInterval(async () => {
      const newTime = watchTime + 30
      setWatchTime(newTime)
      await updateLessonProgress(lesson.id, courseId, newTime)
    }, 30000)

    return () => clearInterval(interval)
  }, [watchTime, isCompleted, lesson.id, courseId, lesson.video_url, lesson.completion_criteria])

  const handleComplete = async () => {
    setLoading(true)
    const result = await markLessonComplete(lesson.id, courseId)
    if (result.success) {
      setIsCompleted(true)
    } else {
      alert(result.error || 'Có lỗi xảy ra')
    }
    setLoading(false)
  }

  // Đánh dấu đã nộp bài tự luận qua link
  const handleEssayConfirm = async () => {
    if (!lesson.assignments || lesson.assignments.length === 0) return

    setSubmittingEssay(true)
    const assignment = lesson.assignments[0]

    const formData = new FormData()
    formData.append('assignmentId', assignment.id)
    formData.append('courseId', courseId)
    formData.append('lessonId', lesson.id)
    formData.append('type', 'link')
    formData.append('content', assignment.essay_link || '')

    const res = await submitAssignment(formData)
    if (res.success) {
      setSubmission(res.data)
      alert('Xác nhận đã nộp bài thành công!')
    } else {
      alert(res.error || 'Có lỗi xảy ra khi xác nhận nộp bài.')
    }
    setSubmittingEssay(false)
  }

  // Kiểm tra điều kiện để đánh dấu Hoàn thành bài học
  const canComplete = () => {
    if (isCompleted) return true
    
    // Nếu bài học có trắc nghiệm, yêu cầu phải làm đúng hết (quizSuccess = true)
    if (lesson.quizzes && lesson.quizzes.length > 0 && !quizSuccess && !isCompleted) {
      return false
    }

    // Nếu bài học có tự luận, yêu cầu học viên phải click xác nhận đã nộp bài
    if (lesson.assignments && lesson.assignments.length > 0 && !submission) {
      return false
    }

    // Nếu yêu cầu thời gian xem video
    if (lesson.video_url && lesson.completion_criteria === 'view') {
      const requiredSeconds = (lesson.duration_minutes * 60) * ((lesson.required_time_percent || 80) / 100)
      return watchTime >= requiredSeconds
    }

    return true
  }

  const hasAssessments = (lesson.quizzes && lesson.quizzes.length > 0) || (lesson.assignments && lesson.assignments.length > 0)
  const hasAttachments = lesson.attachments && lesson.attachments.length > 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 pb-16">
      <div className="max-w-5xl w-full mx-auto p-4 md:p-10 space-y-8">
        
        {/* Breadcrumbs & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <nav className="flex items-center gap-2 text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-widest">
              <Link href="/dashboard/learning" className="hover:text-[#103C11]">Khóa học</Link>
              <ChevronRight size={12} />
              <span className="truncate max-w-[200px]">{lesson.module?.course?.title || 'Đào tạo'}</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">{lesson.title}</h1>
          </div>
          
          <button
            onClick={handleComplete}
            disabled={isCompleted || loading || !canComplete()}
            className={`flex-shrink-0 flex items-center justify-center px-8 py-3.5 rounded-full font-black transition-all shadow-lg ${
              isCompleted 
                ? 'bg-green-100 text-green-700 cursor-default border border-green-200 shadow-none' 
                : canComplete()
                  ? 'bg-[#C7A959] text-white hover:bg-[#d99700] hover:shadow-[#C7A959]/30 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <CheckCircle size={22} className="mr-2" />
                {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </>
            )}
          </button>
        </div>

        {/* Cảnh báo điều kiện hoàn thành */}
        {hasAssessments && !isCompleted && !canComplete() && (
          <div className="bg-[#103C11]/5 border border-[#103C11]/20 p-4 rounded-xl flex items-center gap-3 text-sm text-gray-700">
            <AlertCircle className="text-[#C7A959] shrink-0" size={18} />
            <p>
              Bạn cần làm đúng hết các câu hỏi **Trắc nghiệm** và/hoặc nhấn **Xác nhận nộp bài Tự luận** trong tab **Bài tập & Đánh giá** để hoàn thành bài học này.
            </p>
          </div>
        )}

        {/* Menu Tab học tập */}
        <div className="flex items-center gap-2 bg-gray-200/60 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'content' ? 'bg-white text-[#103C11] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={16} />
            Nội dung chính
          </button>
          
          {hasAssessments && (
            <button
              onClick={() => setActiveTab('assessments')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'assessments' ? 'bg-white text-[#103C11] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award size={16} />
              Bài tập & Đánh giá
            </button>
          )}

          {hasAttachments && (
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'attachments' ? 'bg-white text-[#103C11] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Download size={16} />
              Tài liệu đính kèm
            </button>
          )}
        </div>

        {/* Khu vực hiển thị Tab Content */}
        <div className="space-y-6">
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Nút chuyển đổi Video / Slide nếu cả hai đều tồn tại */}
              {lesson.video_url && lesson.slide_url && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setContentMode('video')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      contentMode === 'video' 
                        ? 'bg-[#103C11] text-white border-[#103C11]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <VideoIcon size={14} />
                    Xem Video
                  </button>
                  <button
                    onClick={() => setContentMode('slide')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      contentMode === 'slide' 
                        ? 'bg-[#103C11] text-white border-[#103C11]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FileText size={14} />
                    Xem Slide bài giảng
                  </button>
                </div>
              )}

              {/* Khung Player */}
              <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                {contentMode === 'video' && lesson.video_url ? (
                  <VideoPlayer url={lesson.video_url} title={lesson.title} />
                ) : contentMode === 'slide' && lesson.slide_url ? (
                  <div className="w-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner h-[600px] relative">
                    <iframe
                      src={lesson.slide_url}
                      className="w-full h-full border-0"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Bài học này không chứa nội dung video hoặc slide trực tiếp. Hãy xem thông tin tổng quan bên dưới.
                  </div>
                )}
              </div>

              {/* Mô tả chi tiết bài học */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
                <h3 className="font-black text-xl text-gray-800 border-b border-gray-50 pb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#C7A959] rounded-full"></div>
                  Tổng quan bài học
                </h3>
                <div 
                  className="prose prose-inspiring max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap text-sm"
                >
                  {lesson.description || 'Chưa có mô tả chi tiết cho bài học này.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessments' && hasAssessments && (
            <div className="space-y-8">
              {/* 1. Phần Trắc nghiệm (MCQ) */}
              {lesson.quizzes && lesson.quizzes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#C7A959] rounded-full"></span>
                    Đánh giá kiến thức: Trắc nghiệm khách quan
                  </h3>
                  <CheckpointQuiz 
                    lessonId={lesson.id} 
                    courseId={courseId} 
                    quizzes={lesson.quizzes} 
                    onSuccess={() => setQuizSuccess(true)}
                  />
                </div>
              )}

              {/* 2. Phần Tự luận (Essay Submission via Link) */}
              {lesson.assignments && lesson.assignments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#C7A959] rounded-full"></span>
                    Đánh giá kỹ năng: Bài tập tự luận thực hành
                  </h3>
                  
                  {submission ? (
                    <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-green-800 space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={28} className="text-green-600" />
                        <div>
                          <h4 className="font-bold text-sm">Bạn đã xác nhận nộp bài tự luận thành công!</h4>
                          <p className="text-xs text-green-700/80">Nộp vào ngày: {new Date(submission.submitted_at).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white/60 rounded-xl space-y-2 text-xs text-gray-700">
                        <p className="font-bold">Trạng thái chấm: {submission.status === 'passed' ? 'Đã đạt' : submission.status === 'failed' ? 'Không đạt' : 'Đang chờ chấm'}</p>
                        {submission.score !== null && <p className="font-bold text-lg text-[#C7A959]">Điểm số: {submission.score}/100</p>}
                        {submission.feedback && <p className="italic">Nhận xét: "{submission.feedback}"</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-gray-800">{lesson.assignments[0].title}</h4>
                        <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {lesson.assignments[0].description}
                        </p>
                      </div>

                      {/* Callout box to upload link */}
                      <div className="bg-[#103C11]/5 border border-[#103C11]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Khu vực nộp bài bên ngoài</p>
                          <p className="text-sm font-bold text-gray-800">Vui lòng nộp bài tập của bạn theo đường dẫn quy định</p>
                        </div>
                        
                        <a
                          href={lesson.assignments[0].essay_link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-[#C7A959] hover:bg-[#d99700] text-white px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 shrink-0"
                        >
                          Nộp bài tại đây
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs text-gray-400 font-medium italic">
                          * Hãy chắc chắn bạn đã nộp bài thành công trước khi nhấn nút xác nhận bên phải.
                        </p>
                        <button
                          onClick={handleEssayConfirm}
                          disabled={submittingEssay}
                          className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#103C11] text-white font-bold text-xs rounded-xl hover:bg-[#1e5c20] transition-colors disabled:opacity-50"
                        >
                          Xác nhận tôi đã nộp bài
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && hasAttachments && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#C7A959] rounded-full"></span>
                Tài liệu & Học liệu đính kèm
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.attachments.map((file: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-[#e6f0e7] group-hover:text-[#103C11] transition-colors shrink-0">
                        <File size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{file.size || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-[#103C11] hover:text-white transition-all shadow-sm shrink-0"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Điều hướng bài trước/sau */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-gray-200">
          {prevLesson ? (
            <Link
              href={`/dashboard/learning/${courseId}/lessons/${prevLesson.id}`}
              className="flex items-center gap-4 group w-full sm:w-auto"
            >
              <div className="p-4 rounded-2xl bg-white border border-gray-100 group-hover:bg-[#e6f0e7] group-hover:border-[#103C11]/20 transition-all shadow-sm group-hover:shadow-md">
                <ChevronLeft size={24} className="text-gray-400 group-hover:text-[#103C11]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Bài trước</p>
                <p className="text-sm font-black text-gray-700 group-hover:text-[#103C11] transition-colors line-clamp-1">{prevLesson.title}</p>
              </div>
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link
              href={`/dashboard/learning/${courseId}/lessons/${nextLesson.id}`}
              className="flex items-center gap-4 group text-right w-full sm:w-auto"
            >
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Bài tiếp theo</p>
                <p className="text-sm font-black text-gray-700 group-hover:text-[#103C11] transition-colors line-clamp-1">{nextLesson.title}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 group-hover:bg-[#e6f0e7] group-hover:border-[#103C11]/20 transition-all shadow-sm group-hover:shadow-md">
                <ChevronRight size={24} className="text-gray-400 group-hover:text-[#103C11]" />
              </div>
            </Link>
          ) : <div />}
        </div>

      </div>
    </div>
  )
}
