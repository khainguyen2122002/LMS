'use client'

import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng Nhập</h2>
      
      {state?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {errorParam === 'inactive' && !state?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          Tài khoản của bạn đã bị vô hiệu hóa hoặc chưa được kích hoạt bởi Quản trị viên.
        </div>
      )}
      
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
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
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#103C11] focus:border-transparent outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#103C11] focus:ring-[#103C11] border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-[#103C11] hover:text-[#1e5c20]">
              Quên mật khẩu?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#103C11] hover:bg-[#1e5c20] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#103C11] transition font-medium disabled:opacity-50"
        >
          {pending ? 'Đang đăng nhập...' : 'Đăng Nhập'}
        </button>

        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={() => {
                const emailInput = document.getElementById('email') as HTMLInputElement
                const passwordInput = document.getElementById('password') as HTMLInputElement
                if (emailInput && passwordInput) {
                  emailInput.value = 'student@local.test'
                  passwordInput.value = '123456'
                  const form = emailInput.closest('form')
                  if (form) {
                    form.requestSubmit()
                  }
                }
              }}
              className="w-full py-2 px-4 border border-amber-300 rounded-lg shadow-sm text-amber-800 bg-amber-50 hover:bg-amber-100 focus:outline-none transition font-bold text-sm text-center flex items-center justify-center gap-2"
            >
              ⚡ Đăng nhập nhanh Học viên ảo (Local)
            </button>
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          Hệ thống không mở đăng ký tự do. Tài khoản học viên và giảng viên được cấp bởi Ban quản trị/HR. Vui lòng liên hệ bộ phận nhân sự để nhận tài khoản của bạn.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-4 text-gray-500">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  )
}

