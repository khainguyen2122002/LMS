'use client'

import React, { useState } from 'react'
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
  Loader2
} from 'lucide-react'

// --- Types ---
interface Lesson {
  id: string
  title: string
  type: string
  order_index: number
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

// --- Add Lesson Modal ---
function AddLessonModal({ moduleId, onClose, onAdd }: {
  moduleId: string
  onClose: () => void
  onAdd: (moduleId: string, lesson: Lesson) => void
}) {
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonType, setLessonType] = useState('video')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonTitle.trim()) return
    onAdd(moduleId, {
      id: `lesson-${Date.now()}`,
      title: lessonTitle.trim(),
      type: lessonType,
      order_index: 0
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Thêm bài học mới</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Tên bài học <span className="text-red-500">*</span></label>
            <input
              autoFocus
              type="text"
              value={lessonTitle}
              onChange={e => setLessonTitle(e.target.value)}
              placeholder="VD: Bài 1: Giới thiệu chung"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Loại bài học</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'video', label: 'Video', icon: <Video size={16} /> },
                { value: 'pdf', label: 'Tài liệu PDF', icon: <FileText size={16} /> },
                { value: 'quiz', label: 'Bài kiểm tra', icon: <CheckCircle2 size={16} /> },
                { value: 'assignment', label: 'Bài tập', icon: <FileCode2 size={16} /> },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLessonType(opt.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    lessonType === opt.value
                      ? 'border-[#103C11] bg-[#e6f0e7] text-[#103C11]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#103C11] text-white font-bold hover:bg-[#1e5c20] transition-colors">
              Thêm bài học
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
            <ListOrdered size={15} /> Thông tin cơ bản
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
      case 'pdf': return <FileText size={16} className="text-red-500" />
      case 'quiz': return <CheckCircle2 size={16} className="text-green-500" />
      case 'assignment': return <FileCode2 size={16} className="text-orange-500" />
      default: return <FileText size={16} className="text-gray-500" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Video'
      case 'pdf': return 'PDF'
      case 'quiz': return 'Bài kiểm tra'
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
        <p className="text-sm font-medium text-gray-700 truncate">{lesson.title}</p>
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
  onAddLesson,
  onDeleteLesson,
  onReorderLessons,
}: {
  module: Module
  allModules: Module[]
  onDelete: (id: string) => void
  onEdit: (module: Module) => void
  onAddLesson: (moduleId: string, lesson: Lesson) => void
  onDeleteLesson: (moduleId: string, lessonId: string) => void
  onReorderLessons: (moduleId: string, activeId: string, overId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAddLesson, setShowAddLesson] = useState(false)

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
    <>
      {showAddLesson && (
        <AddLessonModal
          moduleId={module.id}
          onClose={() => setShowAddLesson(false)}
          onAdd={onAddLesson}
        />
      )}
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
              onClick={() => setShowAddLesson(true)}
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
                      onEdit={(lesson) => {/* Edit lesson inline future */ }}
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
    </>
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
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined)

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

  const handleAddLesson = (moduleId: string, lesson: Lesson) => {
    updateModules(
      modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: [...m.lessons, { ...lesson, order_index: m.lessons.length + 1 }] }
        }
        return m
      })
    )
  }

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
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
                  onAddLesson={handleAddLesson}
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

