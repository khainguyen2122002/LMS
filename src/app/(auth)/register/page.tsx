'use client'

import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signup, null)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng Ký Tài Khoản</h2>
      
      {state?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và Tên *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số Điện Thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
              placeholder="0912345678"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Công ty
            </label>
            <input
              id="company"
              name="company"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
              placeholder="Tên công ty"
            />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Chức vụ
            </label>
            <input
              id="position"
              name="position"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
              placeholder="Ví dụ: HR Manager"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Ngành nghề
            </label>
            <input
              id="industry"
              name="industry"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
              placeholder="Ví dụ: Công nghệ"
            />
          </div>
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
              Năm kinh nghiệm
            </label>
            <input
              id="experience"
              name="experience"
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
              placeholder="0"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#103C11] hover:bg-[#1e5c20] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#103C11] transition font-medium mt-4"
        >
          Đăng Ký
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-[#C7A959] hover:text-[#d8be7b]">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
      
      <p className="mt-4 text-xs text-gray-500 text-center">
        * Lưu ý: Tài khoản của bạn cần được Quản trị viên phê duyệt trước khi có thể truy cập hệ thống khóa học.
      </p>
    </div>
  )
}

