'use client'

import { useState, useRef } from 'react'
import { createUserByAdmin, createMultipleUsersByAdmin } from '@/app/actions/users'
import { X, Upload, FileSpreadsheet, Plus, AlertCircle, CheckCircle2, UserPlus, Info } from 'lucide-react'
import * as XLSX from 'xlsx'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type UserInput = {
  email: string
  fullName: string
  phone: string
  company: string
  position: string
  industry: string
  experienceYears: number | null
  role: string
  is_active: boolean
  passwordFirstTime: string
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual Form State
  const [manualUser, setManualUser] = useState<UserInput>({
    email: '',
    fullName: '',
    phone: '',
    company: '',
    position: '',
    industry: '',
    experienceYears: null,
    role: 'student',
    is_active: true,
    passwordFirstTime: '',
  })

  // Excel Preview State
  const [excelUsers, setExcelUsers] = useState<Array<UserInput & { error?: string }>>([])
  const [excelFileName, setExcelFileName] = useState<string>('')
  const [batchResults, setBatchResults] = useState<{
    successCount: number
    errorCount: number
    details: Array<{ email: string; success: boolean; error?: string }>
  } | null>(null)

  if (!isOpen) return null

  // Xử lý Thay đổi Form thủ công
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setManualUser(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'experienceYears') {
      setManualUser(prev => ({ 
        ...prev, 
        [name]: value === '' ? null : parseInt(value) 
      }))
    } else {
      setManualUser(prev => ({ ...prev, [name]: value }))
    }
  }

  // Submit thủ công
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (!manualUser.email || !manualUser.fullName || !manualUser.passwordFirstTime) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*).')
      setLoading(false)
      return
    }

    try {
      const res = await createUserByAdmin(manualUser, manualUser.passwordFirstTime)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccessMsg(`Tạo tài khoản thành công cho: ${manualUser.fullName} (${manualUser.email})`)
        setManualUser({
          email: '',
          fullName: '',
          phone: '',
          company: '',
          position: '',
          industry: '',
          experienceYears: null,
          role: 'student',
          is_active: true,
          passwordFirstTime: '',
        })
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  // Tải file mẫu
  const downloadTemplate = () => {
    const wsData = [
      {
        'Email*': 'student1@example.com',
        'Họ và Tên*': 'Nguyễn Văn Học Viên',
        'Số điện thoại': '0987654321',
        'Công ty': 'Inspiring HR',
        'Chức vụ': 'Nhân viên HR',
        'Ngành nghề': 'Nhân sự',
        'Số năm kinh nghiệm': 2,
        'Vai trò (student/lecturer/admin)*': 'student',
        'Trạng thái hoạt động (TRUE/FALSE)*': 'TRUE',
        'Mật khẩu khởi tạo*': '123456'
      },
      {
        'Email*': 'lecturer1@example.com',
        'Họ và Tên*': 'Trần Thị Giảng Viên',
        'Số điện thoại': '0912345678',
        'Công ty': 'Đại Học Nhân Sự',
        'Chức vụ': 'Giảng viên chính',
        'Ngành nghề': 'Đào tạo',
        'Số năm kinh nghiệm': 8,
        'Vai trò (student/lecturer/admin)*': 'lecturer',
        'Trạng thái hoạt động (TRUE/FALSE)*': 'TRUE',
        'Mật khẩu khởi tạo*': '123456'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Users')
    XLSX.writeFile(wb, 'LMS_Users_Template.xlsx')
  }

  // Đọc file Excel / CSV
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFileName(file.name)
    setError(null)
    setBatchResults(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        
        // Chuyển sheet thành dạng JSON raw array
        const rawRows = XLSX.utils.sheet_to_json(ws) as Array<any>
        
        if (rawRows.length === 0) {
          setError('File Excel rỗng hoặc không đúng định dạng.')
          return
        }

        // Map và validate dữ liệu
        const parsed: Array<UserInput & { error?: string }> = rawRows.map((row, idx) => {
          const email = (row['Email*'] || row['Email'] || '').toString().trim()
          const fullName = (row['Họ và Tên*'] || row['Họ và Tên'] || row['FullName'] || '').toString().trim()
          const passwordFirstTime = (row['Mật khẩu khởi tạo*'] || row['Mật khẩu'] || row['Password'] || '').toString().trim()
          let role = (row['Vai trò (student/lecturer/admin)*'] || row['Vai trò'] || row['Role'] || 'student').toString().trim().toLowerCase()
          
          if (role === 'học viên') role = 'student'
          if (role === 'giảng viên') role = 'lecturer'
          
          let isActiveRaw = row['Trạng thái hoạt động (TRUE/FALSE)*'] || row['Trạng thái'] || row['Active']
          let is_active = true
          if (isActiveRaw !== undefined) {
            is_active = isActiveRaw.toString().toLowerCase() === 'true' || isActiveRaw === true || isActiveRaw === 1 || isActiveRaw.toString() === '1'
          }

          let experienceYears = null
          const expRaw = row['Số năm kinh nghiệm'] || row['Kinh nghiệm'] || row['Experience']
          if (expRaw !== undefined && expRaw !== '') {
            experienceYears = parseInt(expRaw)
            if (isNaN(experienceYears)) experienceYears = null
          }

          let rowError = ''
          if (!email) rowError += 'Thiếu Email. '
          if (!fullName) rowError += 'Thiếu Họ tên. '
          if (!passwordFirstTime) rowError += 'Thiếu Mật khẩu. '
          if (!['student', 'lecturer', 'admin'].includes(role)) {
            rowError += 'Vai trò không hợp lệ (chỉ được là student, lecturer, admin). '
          }

          return {
            email,
            fullName,
            phone: (row['Số điện thoại'] || row['Điện thoại'] || row['Phone'] || '').toString().trim(),
            company: (row['Công ty'] || row['Company'] || '').toString().trim(),
            position: (row['Chức vụ'] || row['Position'] || '').toString().trim(),
            industry: (row['Ngành nghề'] || row['Industry'] || '').toString().trim(),
            experienceYears,
            role,
            is_active,
            passwordFirstTime,
            error: rowError || undefined
          }
        })

        setExcelUsers(parsed)
      } catch (err: any) {
        setError(`Lỗi đọc file: ${err.message || 'Vui lòng kiểm tra lại định dạng file.'}`)
      }
    }

    reader.readAsBinaryString(file)
  }

  // Gửi import hàng loạt
  const handleBatchSubmit = async () => {
    const invalidUsers = excelUsers.filter(u => u.error)
    if (invalidUsers.length > 0) {
      setError('Vui lòng sửa các dòng dữ liệu bị lỗi trước khi import.')
      return
    }

    if (excelUsers.length === 0) {
      setError('Chưa có danh sách người dùng để import.')
      return
    }

    setLoading(true)
    setError(null)
    setBatchResults(null)

    try {
      const res = await createMultipleUsersByAdmin(excelUsers)
      if (res.error) {
        setError(res.error)
      } else {
        setBatchResults({
          successCount: res.successCount || 0,
          errorCount: res.errorCount || 0,
          details: res.results || []
        })
        setExcelUsers([])
        setExcelFileName('')
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình import.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 transform scale-100 transition-transform">
        
        {/* Header */}
        <div className="bg-[#103C11] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <UserPlus size={24} className="text-[#C7A959]" />
            <h2 className="text-xl font-bold">Thêm Thành Viên Mới</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-300 hover:text-white transition p-1 hover:bg-[#1e5c20] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => {
              setActiveTab('manual')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'manual'
                ? 'border-[#103C11] text-[#103C11] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Plus size={16} />
            <span>Thêm thủ công từng người</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('excel')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'excel'
                ? 'border-[#103C11] text-[#103C11] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Thêm hàng loạt bằng Excel</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Thông báo lỗi chung */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start space-x-2">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Thông báo thành công thủ công */}
          {successMsg && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm flex items-start space-x-2">
              <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Thêm thủ công */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={manualUser.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Email đăng nhập *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={manualUser.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="example@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Mật khẩu cấp lần đầu *
                  </label>
                  <input
                    type="password"
                    name="passwordFirstTime"
                    required
                    value={manualUser.passwordFirstTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm font-mono"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={manualUser.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Công ty
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={manualUser.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="Tên công ty"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={manualUser.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="HR Manager, Staff..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Ngành nghề
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={manualUser.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="Nhân sự, Tech..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Số năm kinh nghiệm
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    min="0"
                    value={manualUser.experienceYears === null ? '' : manualUser.experienceYears}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    name="role"
                    value={manualUser.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition text-sm"
                  >
                    <option value="student">Học viên (Student)</option>
                    <option value="lecturer">Giảng viên (Lecturer)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active_check"
                  name="is_active"
                  checked={manualUser.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#103C11] focus:ring-[#103C11] border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="is_active_check" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                  Kích hoạt tài khoản ngay (Cho phép đăng nhập ngay)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#103C11] hover:bg-[#1e5c20] rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Thêm hàng loạt từ Excel */}
          {activeTab === 'excel' && (
            <div className="space-y-6">
              
              {/* Box Hướng dẫn & Tải mẫu */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex items-start space-x-3">
                <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="flex-1 text-sm text-gray-700 space-y-2">
                  <p className="font-semibold text-amber-900">Hướng dẫn tải lên danh sách học viên:</p>
                  <p className="leading-relaxed">
                    Vui lòng tải về file mẫu Excel và nhập đầy đủ thông tin. Các cột có dấu <strong className="text-red-500">*</strong> là thông tin bắt buộc. Sau khi điền, hãy upload lại file lên hệ thống.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center space-x-2 text-[#103C11] hover:text-[#1e5c20] font-bold text-xs underline"
                  >
                    <Upload size={14} />
                    <span>Tải về file Excel Mẫu (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Khu vực Upload File */}
              {!excelFileName ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#103C11] rounded-2xl p-8 text-center cursor-pointer transition bg-gray-50/40 hover:bg-gray-50 flex flex-col items-center justify-center space-y-2 group"
                >
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-[#103C11]/10 rounded-full flex items-center justify-center transition">
                    <Upload className="text-gray-400 group-hover:text-[#103C11]" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Chọn hoặc kéo thả file Excel vào đây</p>
                  <p className="text-xs text-gray-400">Hỗ trợ định dạng .xlsx, .xls, .csv</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleExcelUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="text-green-600" size={32} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{excelFileName}</p>
                      <p className="text-xs text-gray-500">{excelUsers.length} hàng dữ liệu được tìm thấy</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setExcelFileName('')
                      setExcelUsers([])
                      setError(null)
                    }}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Hủy bỏ & chọn lại
                  </button>
                </div>
              )}

              {/* Bảng xem trước dữ liệu Excel */}
              {excelUsers.length > 0 && !batchResults && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800">Dữ liệu xem trước từ file Excel:</h3>
                  <div className="border border-gray-100 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-600">Dòng</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Email</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Họ và Tên</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Mật khẩu</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Vai trò</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Trạng thái</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Lỗi kiểm tra</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {excelUsers.map((user, idx) => (
                          <tr key={idx} className={user.error ? 'bg-red-50/50' : ''}>
                            <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{user.email || 'N/A'}</td>
                            <td className="px-4 py-2 text-gray-700">{user.fullName || 'N/A'}</td>
                            <td className="px-4 py-2 font-mono text-gray-500">{user.passwordFirstTime}</td>
                            <td className="px-4 py-2">
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] uppercase font-bold">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{user.is_active ? 'ON' : 'OFF'}</td>
                            <td className="px-4 py-2">
                              {user.error ? (
                                <span className="text-red-600 font-semibold text-[10px]">{user.error}</span>
                              ) : (
                                <span className="text-green-600 font-semibold text-[10px]">Hợp lệ</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFileName('')
                        setExcelUsers([])
                      }}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleBatchSubmit}
                      disabled={loading}
                      className="px-6 py-2 text-sm font-semibold text-white bg-[#103C11] hover:bg-[#1e5c20] rounded-lg shadow-sm transition flex items-center space-x-2"
                    >
                      {loading ? (
                        <span>Đang xử lý import...</span>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Import {excelUsers.length} tài khoản</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Hiển thị kết quả Import hàng loạt */}
              {batchResults && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <h3 className="font-bold text-gray-800 flex items-center space-x-2 text-sm">
                      <CheckCircle2 className="text-[#103C11]" size={18} />
                      <span>Kết Quả Import Hàng Loạt:</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-1">
                      <div className="p-2 bg-green-50 text-green-700 rounded-lg text-center">
                        Thành công: <strong className="text-lg block mt-1">{batchResults.successCount}</strong>
                      </div>
                      <div className="p-2 bg-red-50 text-red-700 rounded-lg text-center">
                        Thất bại: <strong className="text-lg block mt-1">{batchResults.errorCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto text-xs">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-600">Email</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Kết quả</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Chi tiết lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {batchResults.details.map((item, idx) => (
                          <tr key={idx} className={item.success ? '' : 'bg-red-50/30'}>
                            <td className="px-4 py-2 font-medium text-gray-900">{item.email}</td>
                            <td className="px-4 py-2">
                              {item.success ? (
                                <span className="text-green-600 font-bold">Thành công</span>
                              ) : (
                                <span className="text-red-600 font-bold">Thất bại</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-500">{item.error || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setBatchResults(null)
                        onClose()
                      }}
                      className="px-6 py-2 text-sm font-semibold text-white bg-[#103C11] hover:bg-[#1e5c20] rounded-lg transition"
                    >
                      Hoàn tất
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

