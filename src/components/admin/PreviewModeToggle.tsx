'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react'

export default function PreviewModeToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const isPreview = searchParams.get('preview') === 'true'

  const togglePreview = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (isPreview) {
      params.delete('preview')
    } else {
      params.set('preview', 'true')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <button
        onClick={togglePreview}
        className={`flex items-center gap-2 px-4 py-3 rounded-full font-semibold shadow-2xl transition-all border-2 ${
          isPreview
            ? 'bg-[#C7A959] text-[#103C11] border-[#C7A959] hover:bg-[#d8be7b]'
            : 'bg-[#103C11] text-white border-[#103C11] hover:bg-[#1e5c20]'
        }`}
      >
        {isPreview ? (
          <>
            <EyeOff size={20} />
            Thoát Chế độ Học viên
          </>
        ) : (
          <>
            <Eye size={20} />
            Xem dưới góc độ Học viên
          </>
        )}
      </button>

      {isPreview && (
        <div className="absolute -top-12 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded animate-pulse whitespace-nowrap">
          Đang ở chế độ xem trước
        </div>
      )}
    </div>
  )
}

