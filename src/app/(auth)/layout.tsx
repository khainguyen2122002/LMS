import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Cột trái: Form */}
      <div className="flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="relative w-24 h-24 mb-4 bg-white p-1 rounded-2xl shadow-md border border-gray-100 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Inspiring HR Logo" 
                width={80} 
                height={80} 
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-black text-[#103C11] tracking-tight">Inspiring HR</h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider font-semibold">Hệ thống Quản lý Học tập Chuyên nghiệp</p>
          </div>
          {children}
        </div>
      </div>

      {/* Cột phải: Hình ảnh/Branding */}
      <div className="hidden md:flex flex-col justify-center items-center p-8 text-white inspiring-gradient relative overflow-hidden">
        {/* Lớp phủ hoa văn nếu cần */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C7A959]/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#C7A959]/10 blur-3xl"></div>
        
        <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
          <div className="relative w-36 h-36 mb-6 bg-white/95 p-4 rounded-3xl shadow-2xl flex items-center justify-center transform hover:rotate-2 transition-transform duration-300">
            <Image 
              src="/logo.png" 
              alt="Inspiring HR Logo Large" 
              width={120} 
              height={120}
              className="object-contain"
            />
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Phát triển <span className="text-[#C7A959] font-black underline decoration-2 decoration-[#C7A959] underline-offset-4">Năng lực</span><br/>
            Kiến tạo <span className="text-[#C7A959] font-black underline decoration-2 decoration-[#C7A959] underline-offset-4">Tương lai</span>
          </h2>
          <p className="text-sm opacity-90 mb-8 max-w-md leading-relaxed font-light">
            Nền tảng đào tạo nhân sự hàng đầu, cung cấp các khóa học chất lượng cao từ các chuyên gia trong ngành.
          </p>
        </div>
      </div>
    </div>
  )
}

