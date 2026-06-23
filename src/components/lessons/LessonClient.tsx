'use client'

import { useState, useEffect } from 'react'
import { markLessonComplete, updateLessonProgress } from '@/app/actions/lessons'

import { CheckCircle, Download, Lock, Info, ChevronRight, ChevronLeft, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import VideoPlayer from './VideoPlayer'
import LiveClassContent from './LiveClassContent'
import CheckpointQuiz from './CheckpointQuiz'
import AssignmentSubmission from './AssignmentSubmission'

interface LessonClientProps {
  lesson: any
  courseId: string
  isCompleted: boolean
  progress?: any
  prevLesson?: any
  nextLesson?: any
  submission?: any // Bài làm hiện tại của học viên
}

export default function LessonClient({ lesson, courseId, isCompleted: initialCompleted, progress, prevLesson, nextLesson, submission: initialSubmission }: LessonClientProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [watchTime, setWatchTime] = useState(progress?.watch_time_seconds || 0)
  const [showQuiz, setShowQuiz] = useState(false)

  // 1. Logic theo dõi thời gian (Level 1)
  useEffect(() => {
    if (isCompleted || lesson.type !== 'video' || lesson.completion_criteria !== 'view') return

    const interval = setInterval(async () => {
      const newTime = watchTime + 30
      setWatchTime(newTime)
      await updateLessonProgress(lesson.id, courseId, newTime)
    }, 30000)

    return () => clearInterval(interval)
  }, [watchTime, isCompleted, lesson.id, courseId, lesson.type, lesson.completion_criteria])

  const handleComplete = async () => {
    // Nếu là loại Quiz, hiện Quiz thay vì mark complete trực tiếp
    if (lesson.completion_criteria === 'quiz' && !isCompleted) {
      setShowQuiz(true)
      return
    }

    setLoading(true)
    const result = await markLessonComplete(lesson.id, courseId)
    if (result.success) {
      setIsCompleted(true)
    } else {
      alert(result.error || 'Có lỗi xảy ra')
    }
    setLoading(false)
  }

  // Kiểm tra điều kiện để mở nút Hoàn thành
  const canComplete = () => {
    if (isCompleted) return true
    if (lesson.type === 'assignment') return false // Bài tập phải đợi giảng viên chấm PASSED
    if (lesson.completion_criteria === 'view') {
      const requiredSeconds = (lesson.duration_minutes * 60) * (lesson.required_time_percent / 100)
      return watchTime >= requiredSeconds
    }
    if (lesson.completion_criteria === 'attendance') return false // Đợi Admin upload report
    return true // Manual hoặc Quiz (nút Quiz sẽ hiện riêng)
  }

  const renderContent = () => {
    if (lesson.type === 'live_class') {
      return <LiveClassContent lesson={lesson} />
    }

    if (lesson.type === 'video') {
      return <VideoPlayer url={lesson.content_url} title={lesson.title} />
    }

    if (lesson.type === 'assignment') {
      return (
        <AssignmentSubmission 
          assignment={lesson.assignments?.[0]} 
          submission={initialSubmission}
          courseId={courseId}
          lessonId={lesson.id}
        />
      )
    }

    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
        <Download size={48} className="text-gray-400 mb-4" />
        <a 
          href={lesson.content_url} 
          target="_blank" 
          rel="noreferrer"
          className="px-6 py-3 bg-[#103C11] text-white rounded-lg font-medium hover:bg-[#1e5c20] transition-colors"
        >
          Tải xuống tài liệu ({lesson.type.toUpperCase()})
        </a>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="max-w-5xl w-full mx-auto p-4 md:p-10 space-y-8">
        
        {/* Breadcrumbs & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <nav className="flex items-center gap-2 text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-widest">
              <Link href="/dashboard/learning" className="hover:text-[#103C11]">Khóa học</Link>
              <ChevronRight size={12} />
              <span className="truncate max-w-[200px]">{lesson.module.course.title}</span>
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
                {isCompleted ? 'Đã hoàn thành' : lesson.completion_criteria === 'quiz' ? 'Làm bài kiểm tra' : 'Đánh dấu hoàn thành'}
              </>
            )}
          </button>
        </div>

        {/* Thông tin tiến độ nếu có điều kiện */}
        {lesson.completion_criteria === 'view' && !isCompleted && (
          <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-inner">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-black text-orange-700 mb-2">
                <span>Tiến độ học tập</span>
                <span>{Math.round((watchTime / (lesson.duration_minutes * 60)) * 100)}% / {lesson.required_time_percent}%</span>
              </div>
              <div className="w-full bg-orange-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  style={{ width: `${Math.min(100, (watchTime / (lesson.duration_minutes * 60)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Khu vực Video hoặc Nội dung */}
        <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {showQuiz && !isCompleted ? (
            <CheckpointQuiz 
              lessonId={lesson.id} 
              courseId={courseId} 
              quizzes={lesson.quizzes || []} 
              onSuccess={() => setIsCompleted(true)}
            />
          ) : renderContent()}
        </div>

        {/* Thông tin bài học & Điều hướng */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="font-black text-xl text-gray-800 border-b border-gray-50 pb-4 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-[#C7A959] rounded-full"></div>
                Tổng quan bài học
              </h3>
              <div className="prose prose-inspiring max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: lesson.description || 'Chưa có nội dung chi tiết cho bài học này.' }}>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-800 mb-4">Thông tin bổ sung</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase">Thời lượng</p>
                    <p className="font-bold text-gray-700">{lesson.duration_minutes} phút</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase">Chương học</p>
                    <p className="font-bold text-gray-700">{lesson.module.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

