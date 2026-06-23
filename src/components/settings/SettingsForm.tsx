'use client'

import React, { useState } from 'react'
import { Save, User, Mail, Briefcase, Building2, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'
import { updateUserProfile } from '@/app/actions/users'

interface Profile {
  id?: string
  email?: string
  full_name?: string
  phone?: string
  company?: string
  position?: string
  industry?: string
  experience_years?: number | null
  role?: string
}

interface SettingsFormProps {
  profile: Profile | null
  userEmail: string
}

const industries = [
  'Nhân sự (HR)',
  'Quản lý & Lãnh đạo',
  'L&D (Learning & Development)',
  'Tài chính & Kế toán',
  'Kinh doanh & Bán hàng',
  'Marketing & Truyền thông',
  'Công nghệ thông tin',
  'Sản xuất & Vận hành',
  'Khác',
]

export default function SettingsForm({ profile, userEmail }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company: profile?.company || '',
    position: profile?.position || '',
    industry: profile?.industry || '',
    experience_years: profile?.experience_years ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const result = await updateUserProfile({
      full_name: formData.full_name,
      phone: formData.phone,
      company: formData.company,
      position: formData.position,
      industry: formData.industry,
      experience_years: formData.experience_years !== '' ? Number(formData.experience_years) : null,
    })

    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'lecturer': return 'Giảng viên'
      case 'student': return 'Học viên'
      default: return 'Chờ phê duyệt'
    }
  }

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'lecturer': return 'bg-blue-100 text-blue-700'
      case 'student': return 'bg-green-100 text-green-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Mail size={18} className="text-[#103C11]" />
            Thông tin tài khoản
          </h2>
        </div>
        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Email đăng nhập</p>
              <p className="font-semibold text-gray-700">{userEmail}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getRoleBadgeClass(profile?.role)}`}>
              {getRoleLabel(profile?.role)}
            </span>
          </div>
          <p className="text-xs text-gray-400 italic">Email tài khoản không thể thay đổi. Liên hệ Admin nếu cần hỗ trợ.</p>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <User size={18} className="text-[#103C11]" />
            Thông tin cá nhân
          </h2>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-bold text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-bold text-gray-700">Số điện thoại</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901 234 567"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Briefcase size={18} className="text-[#103C11]" />
            Thông tin nghề nghiệp
          </h2>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-bold text-gray-700">Công ty / Tổ chức</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="company"
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Tên công ty của bạn"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="position" className="text-sm font-bold text-gray-700">Chức vụ</label>
              <input
                id="position"
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="VD: HR Manager, Trưởng phòng..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="industry" className="text-sm font-bold text-gray-700">Ngành nghề</label>
              <div className="relative">
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm appearance-none bg-white"
                >
                  <option value="">Chọn ngành nghề</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="experience_years" className="text-sm font-bold text-gray-700">Số năm kinh nghiệm</label>
              <input
                id="experience_years"
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                placeholder="VD: 5"
                min={0}
                max={50}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#103C11]/20 focus:border-[#103C11] outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error / Save buttons */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium animate-fade-in">
            <CheckCircle2 size={16} />
            Đã lưu thành công!
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#103C11] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1e5c20] transition-all shadow-lg hover:shadow-[#103C11]/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}

