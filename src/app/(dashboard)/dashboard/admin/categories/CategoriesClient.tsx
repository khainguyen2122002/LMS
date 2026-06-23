'use client'

import React, { useState } from 'react'
import { Plus, Edit, Trash2, FolderOpen, X, Loader2, List } from 'lucide-react'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number
  created_at: string
}

interface CategoriesClientProps {
  initialCategories: Category[]
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)
  
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const openAddModal = () => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setOrderIndex(categories.length + 1)
    setErrorMsg('')
    setShowModal(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setDescription(cat.description || '')
    setOrderIndex(cat.order_index)
    setErrorMsg('')
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setErrorMsg('')

    const payload = {
      name: name.trim(),
      description: description.trim(),
      order_index: Number(orderIndex)
    }

    if (editingCategory) {
      // Update
      const res = await updateCategory(editingCategory.id, payload)
      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.data) {
        setCategories(prev =>
          prev
            .map(c => (c.id === editingCategory.id ? (res.data as Category) : c))
            .sort((a, b) => a.order_index - b.order_index)
        )
        setShowModal(false)
      }
    } else {
      // Create
      const res = await createCategory(payload)
      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.data) {
        setCategories(prev =>
          [...prev, res.data as Category].sort((a, b) => a.order_index - b.order_index)
        )
        setShowModal(false)
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) return

    const res = await deleteCategory(id)
    if (res.error) {
      alert(res.error)
    } else {
      setCategories(prev => prev.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h1>
          <p className="text-gray-500">Tạo và quản lý các danh mục phân loại khóa học.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#103C11] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#1e5c20] transition-all shadow-md"
        >
          <Plus size={20} />
          Thêm danh mục mới
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-16">Thứ tự</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tên danh mục</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Đường dẫn (Slug)</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Mô tả</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen size={40} className="text-gray-300" />
                      <p>Chưa có danh mục nào. Hãy tạo một danh mục mới!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-[#C7A959]">
                      {cat.order_index}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                          <List size={16} />
                        </div>
                        <p className="font-bold text-gray-900">{cat.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 line-clamp-1 max-w-xs mt-3.5">
                      {cat.description || 'Không có mô tả'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-2 text-gray-400 hover:text-[#103C11] transition-colors"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên danh mục <span className="text-red-500">*</span></label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Quản trị nhân sự"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Mô tả ngắn</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  min={0}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#103C11] text-white font-bold hover:bg-[#1e5c20] transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
