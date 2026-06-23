'use client'

import React, { useState, useRef } from 'react'
import { Save, ArrowLeft, Image as ImageIcon, Settings, ListTree, Upload, X, Loader2, CheckCircle2, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CourseBuilder from './CourseBuilder'
import CourseStudentManager from './CourseStudentManager'
import { saveCourse } from '@/app/actions/courses'

interface CourseEditorProps {
  course: any
  categories: any[]
}

export default function CourseEditor({ course, categories }: CourseEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum' | 'students'>('info')
  const [formData, setFormData] = useState({
    title: course?.title || '',
    slug: course?.slug || '',
    description: course?.description || '',
    category_id: course?.category_id || '',
    level: course?.level || 'Cơ bản',
    status: course?.status || 'draft',
    thumbnail_url: course?.thumbnail_url || ''
  })
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(course?.thumbnail_url || '')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [modules, setModules] = useState<any[]>(course?.modules || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)

    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setFormData(prev => ({ ...prev, title: value, slug }))
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setThumbnailPreview(base64)
      setFormData(prev => ({ ...prev, thumbnail_url: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const clearThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview('')
    setFormData(prev => ({ ...prev, thumbnail_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    const result = await saveCourse({
      id: course?.id,
      ...formData,
      modules
    })
    setSaving(false)
    if (result?.error) {
      setSaveError(result.error)
    } else {
      setSaved(true)
      if (!course?.id && result.courseId) {
        router.push(`/dashboard/admin/courses/${result.courseId}`)
      } else {
        // Tải lại trang để đồng bộ ID mới từ database
        window.location.reload()
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/courses"
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#103C11] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{course ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</h1>
            <p className="text-sm text-gray-500">{formData.title || 'Chưa đặt tên'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 size={16} />
              Đã lưu!
            </span>
          )}
          {saveError && (
            <span className="text-sm text-red-500 font-medium">{saveError}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#103C11] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#1e5c20] transition-all shadow-lg hover:shadow-[#103C11]/20 disabled:opacity-60"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'info'
              ? 'bg-white text-[#103C11] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings size={18} />
          Thông tin chung
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'curriculum'
              ? 'bg-white text-[#103C11] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListTree size={18} />
          Chương trình học
        </button>
        {course?.id && (
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'students'
                ? 'bg-white text-[#103C11] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={18} />
            Quản lý học viên
          </button>
        )}
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form chính */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên khóa học <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: Quản trị nhân sự hiện đại"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Slug (URL)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="quan-tri-nhan-su-hien-dai"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all"
                />
                <p className="text-xs text-gray-400">Tự động tạo từ tên. Có thể chỉnh sửa thủ công.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Mô tả khóa học</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Nội dung chi tiết khóa học..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Cột phụ (Sidebar) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Hình ảnh thu nhỏ</label>
                <div
                  className="aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 relative overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors group"
                  onClick={() => !thumbnailPreview && fileInputRef.current?.click()}
                >
                  {thumbnailPreview ? (
                    <>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                          className="flex items-center gap-1.5 bg-white text-gray-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-100"
                        >
                          <Upload size={14} /> Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearThumbnail() }}
                          className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-600"
                        >
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                      <div className="p-3 bg-gray-100 rounded-full group-hover:bg-[#e6f0e7] transition-colors">
                        <Upload size={24} className="group-hover:text-[#103C11] transition-colors" />
                      </div>
                      <span className="text-xs font-medium">Click để tải ảnh lên</span>
                      <span className="text-[10px] text-gray-400">PNG, JPG - 1280×720 khuyến nghị</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                {thumbnailFile && (
                  <p className="text-xs text-gray-400 truncate">📎 {thumbnailFile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Danh mục</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Cấp độ</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all"
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Trung cấp">Trung cấp</option>
                    <option value="Chuyên sâu">Chuyên sâu</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all font-bold"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Xuất bản</option>
                    <option value="closed">Đóng</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'curriculum' ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[500px]">
          <CourseBuilder
            initialModules={modules}
            onModulesChange={setModules}
          />
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[500px]">
          <CourseStudentManager
            courseId={course.id}
            modules={modules}
          />
        </div>
      )}
    </div>
  )
}

