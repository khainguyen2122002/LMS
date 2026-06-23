import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Users, Trophy, ShieldCheck, Video, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-12 h-12 bg-white p-1 rounded-xl shadow-md border border-gray-100 flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Inspiring HR Logo" 
              width={40} 
              height={40} 
              className="object-contain"
            />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">Inspiring <span className="text-[#103C11]">HR LMS</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-bold text-gray-500 hover:text-[#103C11] transition-colors">Tính năng</Link>
          <Link href="#about" className="text-sm font-bold text-gray-500 hover:text-[#103C11] transition-colors">Về chúng tôi</Link>
          <Link href="/login" className="text-sm font-bold text-[#103C11] hover:opacity-80 transition-opacity">Đăng nhập</Link>
          <Link 
            href="/login" 
            className="bg-[#C7A959] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-[#C7A959]/30 transition-all active:scale-95"
          >
            Bắt đầu học ngay
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#103C11]/5 -z-10 rounded-l-[100px] transform translate-x-20"></div>
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-[#e6f0e7] px-4 py-2 rounded-full text-[#103C11] text-xs font-bold uppercase tracking-widest">
                <ShieldCheck size={16} />
                Nền tảng đào tạo nhân sự chuyên nghiệp
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1]">
                Nâng tầm <span className="text-[#103C11]">Năng lực</span> Nhân sự của bạn
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Hệ thống quản lý học tập (LMS) toàn diện giúp doanh nghiệp xây dựng lộ trình phát triển kỹ năng bài bản, chuyên nghiệp và hiệu quả.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto bg-[#103C11] text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-[#1e5c20] shadow-2xl shadow-[#103C11]/30 transition-all flex items-center justify-center gap-2 group"
                >
                  Khám phá ngay
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#features" 
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-center"
                >
                  Tìm hiểu thêm
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#103C11] to-[#1e5c20] rounded-[40px] shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-700"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                      <Video size={40} />
                   </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#C7A959] rounded-full blur-3xl opacity-50"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6">Tính năng ưu việt</h2>
              <p className="text-gray-500 font-medium">Chúng tôi cung cấp mọi công cụ cần thiết để bạn quản lý và phát triển nguồn nhân lực một cách tối ưu.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <BookOpen className="text-blue-500" />, title: "Khóa học Đa dạng", desc: "Hệ thống bài giảng từ video, tài liệu đến bài tập thực hành phong phú." },
                { icon: <Video className="text-red-500" />, title: "Live Class", desc: "Tích hợp Microsoft Teams cho các buổi đào tạo trực tiếp thời gian thực." },
                { icon: <ShieldCheck className="text-green-500" />, title: "Bảo mật Tuyệt đối", desc: "Hệ thống RLS và Middleware đảm bảo dữ liệu luôn được an toàn." },
                { icon: <FileText className="text-orange-500" />, title: "Quản lý Bài tập", desc: "Chấm điểm, Feedback và nộp bài trực tiếp qua OneDrive/SharePoint." },
                { icon: <Trophy className="text-yellow-500" />, title: "Chứng nhận", desc: "Tự động cấp chứng nhận sau khi hoàn thành lộ trình đào tạo." },
                { icon: <Users className="text-purple-500" />, title: "Dashboard", desc: "Theo dõi tiến độ học tập của từng học viên một cách chi tiết." },
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#103C11] text-white py-16 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 bg-white p-1 rounded-xl flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Inspiring HR Logo" 
                  width={32} 
                  height={32} 
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-black tracking-tight">Inspiring HR</span>
            </div>
            <p className="text-white/60 max-w-sm text-sm leading-relaxed">
              Đồng hành cùng doanh nghiệp trong việc nâng tầm giá trị nguồn nhân lực thông qua công nghệ đào tạo hiện đại.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Liên kết</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link href="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Đăng nhập</Link></li>
              <li><span className="text-white/40 cursor-not-allowed">Đăng ký (Đã đóng)</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Liên hệ</h4>
            <ul className="space-y-4 text-sm text-white/60 font-medium">
              <li>Email: contact@inspiringhr.vn</li>
              <li>Hotline: (028) 123 4567</li>
              <li>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-16 pt-8 border-t border-white/10 text-center text-xs text-white/40 font-bold uppercase tracking-widest">
          © 2026 Inspiring HR LMS. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

