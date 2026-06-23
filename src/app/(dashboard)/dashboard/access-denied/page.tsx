import React from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'Từ chối truy cập - Inspiring HR LMS',
  description: 'Bạn không có quyền truy cập vào nội dung này.'
}

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full text-center relative overflow-hidden space-y-6">
        {/* Background Accent Gradients */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7A959]/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#103C11]/5 rounded-full blur-2xl"></div>

        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 text-red-500 shadow-sm animate-bounce">
          <ShieldAlert size={32} />
        </div>

        {/* Text Content */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Truy cập bị giới hạn</h1>
          <p className="text-sm font-semibold text-gray-500 leading-relaxed">
            Nội dung bài học này tạm thời không thuộc phạm vi truy cập của tài khoản bạn.
          </p>
        </div>

        {/* Informative Alert */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs text-gray-600 font-medium text-left flex gap-3">
          <HelpCircle size={16} className="text-[#C7A959] shrink-0 mt-0.5" />
          <p>
            Quản trị viên hoặc Giảng viên đã đặt cấu hình giới hạn quyền học đối với tài liệu này. 
            Vui lòng liên hệ với bộ phận đào tạo để được cấp quyền học bài học này.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 relative z-10">
          <Link
            href="/dashboard/courses"
            className="w-full py-3.5 px-6 bg-[#103C11] hover:bg-[#1e5c20] text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Quay lại danh sách khóa học
          </Link>
        </div>
      </div>
    </div>
  )
}
