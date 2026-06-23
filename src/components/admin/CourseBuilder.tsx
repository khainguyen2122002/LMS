'use client'

import React, { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Plus,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  X,
  Image as ImageIcon,
  Tag,
  Clock,
  ListOrdered,
  FileCode2,
  CheckCircle2,
  Link as LinkIcon,
  StickyNote,
  Settings2,
  Loader2,
  HelpCircle,
  Upload,
  BookOpen,
  File
} from 'lucide-react'
import { uploadFile } from '@/app/actions/upload'

// --- Types ---
interface Quiz {
  id?: string
  question: string
  options: string[]
  correct_option_index: number
  explanation?: string
}

interface Lesson {
  id: string
  title: string
  type: string
  order_index: number
  description?: string
  duration_minutes?: number
  video_url?: string
  slide_url?: string
  attachments?: any[]
  quizzes?: Quiz[]
  essay_title?: string
  essay_description?: string
  essay_link?: string
}

interface Module {
  id: string
  title: string
  description?: string
  order_index: number
  thumbnail_url?: string
  duration_minutes?: number
  status?: string
  prerequisite_module_id?: string
  tags?: string
  internal_note?: string
  lessons: Lesson[]
}

// --- Add/Edit Chapter Modal ---
function ChapterModal({
  module,
  allModules,
  onClose,
  onSave
}: {
  module?: Module
  allModules: Module[]
  onClose: () => void
  onSave: (data: Partial<Module>) => void
}) {
  const isEdit = !!module
  const [form, setForm] = useState({
    title: module?.title || '',
    description: module?.description || '',
    order_index: module?.order_index || (allModules.length + 1),
    thumbnail_url: module?.thumbnail_url || '',
    duration_minutes: module?.duration_minutes || '',
    status: module?.status || 'published',
    prerequisite_module_id: module?.prerequisite_module_id || '',
    tags: module?.tags || '',
    internal_note: module?.internal_note || '',
  })
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced'>('basic')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      ...form,
      order_index: Number(form.order_index),
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
    })
    onClose()
  }

  const otherModules = allModules.filter(m => m.id !== module?.id)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{isEdit ? 'Chỉnh sửa chương' : 'Thêm chương mới'}</h3>
            <p className="text-sm text-gray-400 mt-0.5">Nhập thông tin chi tiết cho chương học</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'basic' ? 'bg-[#e6f0e7] text-[#103C11]' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <BookOpen size={15} /> Thông tin cơ bản
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('advanced')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'advanced' ? 'bg-[#e6f0e7] text-[#103C11]' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Settings2 size={15} /> Nâng cao
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">
            {activeSection === 'basic' ? (
              <>
                {/* 1. Title */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <ListOrdered size={14} className="text-[#103C11]" />
                    Tiêu đề chương <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="VD: Chương 1: Giới thiệu về Quản trị Nhân sự"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                    required
                  />
                  <p className="text-xs text-gray-400">Nên rõ ràng, có số thứ tự để học viên dễ theo dõi.</p>
                </div>

                {/* 2. Description */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FileText size={14} className="text-[#103C11]" />
                    Mô tả ngắn gọn
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tóm tắt mục tiêu học tập của chương..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all resize-none text-sm"
                  />
                </div>

                {/* 3. Order & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <ListOrdered size={14} className="text-[#103C11]" />
                      Số thứ tự
                    </label>
                    <input
                      type="number"
                      name="order_index"
                      value={form.order_index}
                      onChange={handleChange}
                      min={1}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Clock size={14} className="text-[#103C11]" />
                      Thời lượng (phút)
                    </label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={form.duration_minutes}
                      onChange={handleChange}
                      placeholder="VD: 60"
                      min={0}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* 4. Status */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#103C11]" />
                    Trạng thái
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'published', label: 'Xuất bản', color: 'text-green-700 border-green-400 bg-green-50' },
                      { value: 'draft', label: 'Bản nháp', color: 'text-yellow-700 border-yellow-400 bg-yellow-50' },
                      { value: 'hidden', label: 'Ẩn', color: 'text-gray-600 border-gray-300 bg-gray-50' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                        className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.status === opt.value ? opt.color + ' ring-2 ring-offset-1' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Thumbnail URL */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <ImageIcon size={14} className="text-[#103C11]" />
                    Hình ảnh đại diện (URL)
                  </label>
                  <input
                    type="url"
                    name="thumbnail_url"
                    value={form.thumbnail_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                  />
                  {form.thumbnail_url && (
                    <img
                      src={form.thumbnail_url}
                      alt="preview"
                      className="w-full aspect-video object-cover rounded-xl border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 6. Prerequisite */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <LinkIcon size={14} className="text-[#103C11]" />
                    Chương điều kiện (Prerequisite)
                  </label>
                  <select
                    name="prerequisite_module_id"
                    value={form.prerequisite_module_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm bg-white"
                  >
                    <option value="">Không có (học viên học trực tiếp)</option>
                    {otherModules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">Học viên cần hoàn thành chương này trước mới được mở chương hiện tại.</p>
                </div>

                {/* 7. Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Tag size={14} className="text-[#103C11]" />
                    Tags / Từ khóa
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="VD: tuyển dụng, onboarding, OKR (phân cách bằng dấu phẩy)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400">Giúp học viên tìm kiếm và lọc nội dung dễ hơn.</p>
                </div>

                {/* 8. Internal Note */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <StickyNote size={14} className="text-[#103C11]" />
                    Ghi chú nội bộ (Admin only)
                  </label>
                  <textarea
                    name="internal_note"
                    value={form.internal_note}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ghi chú cho nội bộ, học viên sẽ không thấy..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all resize-none text-sm"
                  />
                </div>

                {/* 9. Advanced note */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-700 font-medium flex items-start gap-2">
                    <Settings2 size={14} className="mt-0.5 flex-shrink-0" />
                    Tính năng nâng cao như điều kiện hoàn thành (completion rules), chế độ học thử (free preview) và cài đặt phân quyền sẽ được thêm trong phiên bản tiếp theo.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#103C11] text-white font-bold hover:bg-[#1e5c20] transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              {isEdit ? 'Lưu thay đổi' : 'Thêm chương'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- Unified Lesson Modal (Add & Edit) ---
function LessonModal({
  moduleId,
  lesson,
  onClose,
  onSave
}: {
  moduleId: string
  lesson?: Lesson
  onClose: () => void
  onSave: (moduleId: string, lesson: Lesson) => void
}) {
  const isEdit = !!lesson
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'assignments'>('basic')
  
  // General Info States
  const [title, setTitle] = useState(lesson?.title || '')
  const [type, setType] = useState(lesson?.type || 'video')
  const [description, setDescription] = useState(lesson?.description || '')
  const [durationMinutes, setDurationMinutes] = useState(lesson?.duration_minutes || 15)
  
  // Content States
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '')
  const [slideUrl, setSlideUrl] = useState(lesson?.slide_url || '')
  const [attachments, setAttachments] = useState<any[]>(lesson?.attachments || [])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Assignments States (MCQ + Essay)
  const [quizzes, setQuizzes] = useState<Quiz[]>(lesson?.quizzes || [])
  const [essayTitle, setEssayTitle] = useState(lesson?.essay_title || '')
  const [essayDescription, setEssayDescription] = useState(lesson?.essay_description || '')
  const [essayLink, setEssayLink] = useState(lesson?.essay_link || '')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingFile(true)
    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i]
      const formData = new FormData()
      formData.append('file', fileObj)

      const res = await uploadFile(formData)
      if (res.error) {
        alert(res.error)
      } else if (res.url) {
        setAttachments(prev => [...prev, { name: res.name, url: res.url, size: res.size }])
      }
    }
    setUploadingFile(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Quiz Editor Functions
  const addQuizQuestion = () => {
    setQuizzes(prev => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
        explanation: ''
      }
    ])
  }

  const removeQuizQuestion = (index: number) => {
    setQuizzes(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuizField = (index: number, field: keyof Quiz, value: any) => {
    setQuizzes(prev =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    )
  }

  const updateQuizOption = (quizIndex: number, optionIndex: number, value: string) => {
    setQuizzes(prev =>
      prev.map((q, i) => {
        if (i === quizIndex) {
          const newOptions = [...q.options]
          newOptions[optionIndex] = value
          return { ...q, options: newOptions }
        }
        return q
      })
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSave(moduleId, {
      id: lesson?.id || `lesson-${Date.now()}`,
      title: title.trim(),
      type,
      order_index: lesson?.order_index || 0,
      description: description.trim(),
      duration_minutes: Number(durationMinutes),
      video_url: videoUrl.trim(),
      slide_url: slideUrl.trim(),
      attachments,
      quizzes,
      essay_title: essayTitle.trim(),
      essay_description: essayDescription.trim(),
      essay_link: essayLink.trim()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              {isEdit ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{title || 'Chưa đặt tên bài học'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 px-6 pt-4 flex-shrink-0 border-b border-gray-50 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'basic' ? 'bg-[#e6f0e7] text-[#103C11]' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={16} /> Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'content' ? 'bg-[#e6f0e7] text-[#103C11]' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Video size={16} /> Nội dung & Tài liệu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'assignments' ? 'bg-[#e6f0e7] text-[#103C11]' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FileCode2 size={16} /> Bài tập & Đánh giá
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên bài học <span className="text-red-500">*</span></label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Bài 1: Tổng quan quy chế công ty"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Loại bài học chính</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm bg-white"
                  >
                    <option value="video">Video (Ưu tiên hiển thị)</option>
                    <option value="slide">Slide (PowerPoint / PDF)</option>
                    <option value="assignment">Bài tập (Trắc nghiệm / Tự luận)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Thời lượng học (phút)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Mô tả bài học</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung bài học..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <Video size={16} className="text-[#103C11]" />
                  Link Video bài học
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... hoặc Microsoft Stream Link"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                />
                <p className="text-[10px] text-gray-400">Hỗ trợ các link YouTube, Microsoft Teams record, Microsoft Stream.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <FileText size={16} className="text-[#103C11]" />
                  Link nhúng Slide (PowerPoint Online, Google Slides)
                </label>
                <input
                  type="url"
                  value={slideUrl}
                  onChange={e => setSlideUrl(e.target.value)}
                  placeholder="https://onedrive.live.com/embed?..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <Upload size={16} className="text-[#103C11]" />
                  Tài liệu đính kèm (Video, PDF, Word, Excel...)
                </label>
                
                <div 
                  onClick={() => !uploadingFile && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-[#103C11] transition-all cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {uploadingFile ? (
                    <>
                      <Loader2 className="animate-spin text-[#103C11]" size={32} />
                      <span className="text-xs text-gray-500 font-bold">Đang tải file lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-xs text-gray-500 font-bold">Nhấp vào đây để tải tài liệu lên hệ thống local</span>
                    </>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500">Danh sách tài liệu đính kèm ({attachments.length}):</p>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 divide-y divide-gray-200 max-h-40 overflow-y-auto">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="py-2 px-3 flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 truncate max-w-[300px] flex items-center gap-1">
                            <File size={14} className="text-gray-400 flex-shrink-0" />
                            {file.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400">{file.size}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {/* 1. Phần Trắc nghiệm (MCQ) */}
              <div className="space-y-4 border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#103C11] text-sm flex items-center gap-1.5">
                    <HelpCircle size={16} />
                    1. Đánh giá Trắc nghiệm (MCQ)
                  </h4>
                  <button
                    type="button"
                    onClick={addQuizQuestion}
                    className="flex items-center gap-1 text-xs font-bold text-[#C7A959] hover:text-[#d99700] transition-colors"
                  >
                    <Plus size={14} /> Thêm câu hỏi
                  </button>
                </div>

                {quizzes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Chưa có câu hỏi trắc nghiệm nào cho bài học này.</p>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {quizzes.map((quiz, qIdx) => (
                      <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => removeQuizQuestion(qIdx)}
                          className="absolute right-4 top-4 text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700">Câu hỏi {qIdx + 1}</label>
                          <input
                            type="text"
                            value={quiz.question}
                            onChange={e => updateQuizField(qIdx, 'question', e.target.value)}
                            placeholder="Nhập nội dung câu hỏi..."
                            className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 focus:ring-1 focus:ring-[#103C11] outline-none text-xs"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {quiz.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={quiz.correct_option_index === optIdx}
                                onChange={() => updateQuizField(qIdx, 'correct_option_index', optIdx)}
                                className="text-[#103C11] focus:ring-[#103C11] w-4 h-4 shrink-0"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => updateQuizOption(qIdx, optIdx, e.target.value)}
                                placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`}
                                className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-xs outline-none"
                                required
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Giải thích đáp án</label>
                          <input
                            type="text"
                            value={quiz.explanation || ''}
                            onChange={e => updateQuizField(qIdx, 'explanation', e.target.value)}
                            placeholder="Giải thích vì sao lựa chọn này đúng..."
                            className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Phần Tự luận */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#103C11] text-sm flex items-center gap-1.5">
                  <FileCode2 size={16} />
                  2. Đánh giá Tự luận (Essay)
                </h4>

                <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Link nộp bài tự luận</label>
                    <input
                      type="url"
                      value={essayLink}
                      onChange={e => setEssayLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... hoặc Google Form Link"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 focus:ring-1 focus:ring-[#103C11] outline-none text-xs"
                    />
                    <p className="text-[10px] text-gray-400">Nhập đường dẫn để học viên nộp file bài tập (Google Drive, Dropbox, v.v.)</p>
                  </div>

                  {essayLink.trim() !== '' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Tiêu đề bài tự luận</label>
                        <input
                          type="text"
                          value={essayTitle}
                          onChange={e => setEssayTitle(e.target.value)}
                          placeholder="VD: Bài thu hoạch chuyên đề 1"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 outline-none text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Yêu cầu tự luận</label>
                        <textarea
                          value={essayDescription}
                          onChange={e => setEssayDescription(e.target.value)}
                          placeholder="Yêu cầu học viên cần trình bày những gì..."
                          rows={3}
                          className="w-full p-3 bg-white rounded-lg border border-gray-200 outline-none text-xs resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 -m-6 p-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors">
              Hủy
            </button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#103C11] text-white font-bold hover:bg-[#1e5c20] transition-colors">
              {isEdit ? 'Lưu thay đổi' : 'Thêm bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- Sortable Lesson Item ---
function SortableLesson({ lesson, onDelete, onEdit }: {
  lesson: Lesson
  onDelete: (id: string) => void
  onEdit: (lesson: Lesson) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-blue-500" />
      case 'slide': return <FileText size={16} className="text-red-500" />
      case 'assignment': return <FileCode2 size={16} className="text-orange-500" />
      default: return <FileText size={16} className="text-gray-500" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Video'
      case 'slide': return 'Slide'
      case 'assignment': return 'Bài tập'
      default: return type
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm mb-2 group"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical size={18} />
      </button>
      <div className="p-1.5 bg-gray-50 rounded-md">
        {getIcon(lesson.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-700 truncate">{lesson.title}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-tight">{getTypeName(lesson.type)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(lesson)}
          className="p-1.5 text-gray-400 hover:text-[#103C11] transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(lesson.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// --- Sortable Module Item ---
function SortableModule({
  module,
  allModules,
  onDelete,
  onEdit,
  onAddLessonPress,
  onEditLessonPress,
  onDeleteLesson,
  onReorderLessons,
}: {
  module: Module
  allModules: Module[]
  onDelete: (id: string) => void
  onEdit: (module: Module) => void
  onAddLessonPress: (moduleId: string) => void
  onEditLessonPress: (moduleId: string, lesson: Lesson) => void
  onDeleteLesson: (moduleId: string, lessonId: string) => void
  onReorderLessons: (moduleId: string, activeId: string, overId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorderLessons(module.id, active.id as string, over.id as string)
    }
  }

  const statusBadge = () => {
    switch (module.status) {
      case 'published': return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Xuất bản</span>
      case 'draft': return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Nháp</span>
      case 'hidden': return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Ẩn</span>
      default: return null
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 border border-gray-200 rounded-xl mb-4 overflow-hidden ${isDragging ? 'shadow-lg ring-2 ring-[#103C11]/20' : ''}`}
    >
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical size={20} />
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
            {module.title}
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
              {module.lessons.length} bài học
            </span>
            {statusBadge()}
            {module.duration_minutes && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-normal flex items-center gap-1">
                <Clock size={10} /> {module.duration_minutes} phút
              </span>
            )}
          </h3>
          {module.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{module.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onAddLessonPress(module.id)}
            className="flex items-center gap-1 text-xs font-bold text-[#103C11] bg-[#e6f0e7] px-3 py-1.5 rounded-lg hover:bg-[#d8e8da] transition-colors"
          >
            <Plus size={14} />
            Thêm bài học
          </button>
          <button
            onClick={() => onEdit(module)}
            className="p-2 text-gray-400 hover:text-[#103C11] transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(module.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-gray-50/50">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={module.lessons.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {module.lessons.length > 0 ? (
                module.lessons.map(lesson => (
                  <SortableLesson
                    key={lesson.id}
                    lesson={lesson}
                    onDelete={(lessonId) => onDeleteLesson(module.id, lessonId)}
                    onEdit={(les) => onEditLessonPress(module.id, les)}
                  />
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                  Chương này chưa có bài học nào. Nhấn <span className="font-bold text-[#103C11]">"Thêm bài học"</span> để bắt đầu.
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

// --- Main Builder Component ---
export default function CourseBuilder({
  initialModules,
  onModulesChange
}: {
  initialModules: Module[]
  onModulesChange?: (modules: Module[]) => void
}) {
  const [modules, setModules] = useState<Module[]>(initialModules)
  
  // Modals status
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined)

  const [showLessonModal, setShowLessonModal] = useState(false)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>(undefined)

  const updateModules = (updated: Module[]) => {
    setModules(updated)
    onModulesChange?.(updated)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setModules(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const updated = arrayMove(items, oldIndex, newIndex)
        onModulesChange?.(updated)
        return updated
      })
    }
  }

  const handleReorderLessons = (moduleId: string, activeId: string, overId: string) => {
    updateModules(
      modules.map(module => {
        if (module.id === moduleId) {
          const oldIndex = module.lessons.findIndex(l => l.id === activeId)
          const newIndex = module.lessons.findIndex(l => l.id === overId)
          return { ...module, lessons: arrayMove(module.lessons, oldIndex, newIndex) }
        }
        return module
      })
    )
  }

  const handleAddModule = (data: Partial<Module>) => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: data.title || 'Chương mới',
      description: data.description,
      order_index: data.order_index || modules.length + 1,
      thumbnail_url: data.thumbnail_url,
      duration_minutes: data.duration_minutes,
      status: data.status || 'published',
      prerequisite_module_id: data.prerequisite_module_id,
      tags: data.tags,
      internal_note: data.internal_note,
      lessons: []
    }
    updateModules([...modules, newModule])
  }

  const handleEditModule = (module: Module) => {
    setEditingModule(module)
    setShowChapterModal(true)
  }

  const handleSaveEditModule = (data: Partial<Module>) => {
    if (!editingModule) return
    updateModules(
      modules.map(m => m.id === editingModule.id ? { ...m, ...data } : m)
    )
    setEditingModule(undefined)
  }

  const handleDeleteModule = (id: string) => {
    if (!confirm('Xóa chương này và tất cả bài học bên trong?')) return
    updateModules(modules.filter(m => m.id !== id))
  }

  // Open Lesson Modal Actions
  const handleOpenAddLesson = (moduleId: string) => {
    setActiveModuleId(moduleId)
    setEditingLesson(undefined)
    setShowLessonModal(true)
  }

  const handleOpenEditLesson = (moduleId: string, lesson: Lesson) => {
    setActiveModuleId(moduleId)
    setEditingLesson(lesson)
    setShowLessonModal(true)
  }

  const handleSaveLesson = (moduleId: string, lessonData: Lesson) => {
    if (editingLesson) {
      // Edit mode
      updateModules(
        modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.map(l => (l.id === editingLesson.id ? lessonData : l))
            }
          }
          return m
        })
      )
    } else {
      // Add mode
      updateModules(
        modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: [...m.lessons, { ...lessonData, order_index: m.lessons.length + 1 }]
            }
          }
          return m
        })
      )
    }
    setShowLessonModal(false)
    setEditingLesson(undefined)
    setActiveModuleId(null)
  }

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài học này?')) return
    updateModules(
      modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
        }
        return m
      })
    )
  }

  return (
    <>
      {/* Chapter Modal */}
      {showChapterModal && (
        <ChapterModal
          module={editingModule}
          allModules={modules}
          onClose={() => {
            setShowChapterModal(false)
            setEditingModule(undefined)
          }}
          onSave={editingModule ? handleSaveEditModule : handleAddModule}
        />
      )}

      {/* Lesson Modal */}
      {showLessonModal && activeModuleId && (
        <LessonModal
          moduleId={activeModuleId}
          lesson={editingLesson}
          onClose={() => {
            setShowLessonModal(false)
            setEditingLesson(undefined)
            setActiveModuleId(null)
          }}
          onSave={handleSaveLesson}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cấu trúc khóa học</h2>
            <p className="text-sm text-gray-400 mt-0.5">Kéo thả để sắp xếp thứ tự các chương và bài học.</p>
          </div>
          <button
            onClick={() => { setEditingModule(undefined); setShowChapterModal(true) }}
            className="flex items-center gap-2 bg-[#103C11] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-[#1e5c20] transition-all shadow-sm"
          >
            <Plus size={20} />
            Thêm chương mới
          </button>
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ListOrdered size={28} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">Chưa có chương học nào</p>
            <p className="text-sm mt-1">Nhấn "Thêm chương mới" để bắt đầu xây dựng khóa học.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {modules.map(module => (
                <SortableModule
                  key={module.id}
                  module={module}
                  allModules={modules}
                  onDelete={handleDeleteModule}
                  onEdit={handleEditModule}
                  onAddLessonPress={handleOpenAddLesson}
                  onEditLessonPress={handleOpenEditLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onReorderLessons={handleReorderLessons}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  )
}
