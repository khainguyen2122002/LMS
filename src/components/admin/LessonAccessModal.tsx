'use client'

import React, { useState } from 'react'
import { X, Lock, Unlock, CheckSquare, Square, Loader2, Save } from 'lucide-react'
import { updateBlockedLessons } from '@/app/actions/enrollments'

interface Lesson {
  id: string
  title: string
  type: string
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface LessonAccessModalProps {
  enrollment: any
  courseId: string
  modules: Module[]
  onClose: () => void
  onSuccess: (updatedBlocked: string[]) => void
}

export default function LessonAccessModal({
  enrollment,
  courseId,
  modules,
  onClose,
  onSuccess
}: LessonAccessModalProps) {
  const [blockedLessons, setBlockedLessons] = useState<string[]>(enrollment.blocked_lessons || [])
  const [saving, setSaving] = useState(false)

  const isLessonBlocked = (lessonId: string) => blockedLessons.includes(lessonId)

  const toggleLesson = (lessonId: string) => {
    if (blockedLessons.includes(lessonId)) {
      setBlockedLessons(prev => prev.filter(id => id !== lessonId))
    } else {
      setBlockedLessons(prev => [...prev, lessonId])
    }
  }

  // Bật/tắt tất cả bài học trong một chương
  const toggleModule = (module: Module) => {
    const lessonIds = module.lessons.map(l => l.id)
    const allBlocked = lessonIds.every(id => blockedLessons.includes(id))

    if (allBlocked) {
      // Mở chặn toàn bộ
      setBlockedLessons(prev => prev.filter(id => !lessonIds.includes(id)))
    } else {
      // Chặn toàn bộ bài học trong chương
      const toBlock = lessonIds.filter(id => !blockedLessons.includes(id))
      setBlockedLessons(prev => [...prev, ...toBlock])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await updateBlockedLessons(enrollment.id, blockedLessons, courseId)
    setSaving(false)

    if (res.error) {
      alert(res.error)
    } else {
      onSuccess(blockedLessons)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Phân quyền học liệu</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Học viên: <span className="font-bold text-[#103C11]">{enrollment.student?.full_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex gap-2">
            <Lock size={16} className="shrink-0 mt-0.5" />
            <p>
              Tích chọn (<span className="font-bold">Đã chặn</span>) để tạm thời ẩn bài học này đối với học viên. 
              Mặc định để trống (<span className="font-bold text-green-700">Cho phép</span>) học viên được học bình thường.
            </p>
          </div>

          <div className="space-y-4">
            {modules.map((mod) => {
              const allLessonsBlocked = mod.lessons.length > 0 && mod.lessons.every(l => isLessonBlocked(l.id))
              
              return (
                <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">{mod.title}</span>
                    <button
                      type="button"
                      onClick={() => toggleModule(mod)}
                      className="text-[10px] font-bold text-[#103C11] hover:underline"
                    >
                      {allLessonsBlocked ? 'Mở chặn toàn bộ' : 'Chặn toàn bộ chương'}
                    </button>
                  </div>
                  
                  <div className="divide-y divide-gray-100 bg-white">
                    {mod.lessons.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 italic">Chương này chưa có bài học</p>
                    ) : (
                      mod.lessons.map((lesson) => {
                        const blocked = isLessonBlocked(lesson.id)
                        return (
                          <div 
                            key={lesson.id} 
                            onClick={() => toggleLesson(lesson.id)}
                            className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition-colors text-xs"
                          >
                            <span className="text-gray-700 font-medium">{lesson.title}</span>
                            <div className="flex items-center gap-2">
                              {blocked ? (
                                <span className="flex items-center gap-1 text-red-600 font-bold uppercase text-[9px] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  <Lock size={10} /> Đang chặn
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-700 font-bold uppercase text-[9px] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                  <Unlock size={10} /> Cho phép học
                                </span>
                              )}
                              
                              <div className="text-gray-400">
                                {blocked ? (
                                  <CheckSquare className="text-red-500" size={18} />
                                ) : (
                                  <Square size={18} />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors">
            Hủy
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-[#103C11] text-white font-bold hover:bg-[#1e5c20] transition-colors flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu phân quyền
          </button>
        </div>
      </div>
    </div>
  )
}
