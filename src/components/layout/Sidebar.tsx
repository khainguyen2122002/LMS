'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  List,
  GraduationCap
} from 'lucide-react'

import Image from 'next/image'

type Role = 'admin' | 'lecturer' | 'student' | 'pending' | 'rejected'

interface SidebarProps {
  role: Role
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]

    if (role === 'admin') {
      return [
        ...baseItems,
        { name: 'Khóa học', href: '/dashboard/courses', icon: GraduationCap },
        { name: 'Quản lý Khóa học', href: '/dashboard/admin/courses', icon: BookOpen },
        { name: 'Người dùng', href: '/dashboard/admin/users', icon: Users },
        { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
      ]
    }

    if (role === 'lecturer') {
      return [
        ...baseItems,
        { name: 'Quản lý Khóa học', href: '/dashboard/admin/courses', icon: BookOpen },
        { name: 'Học viên', href: '/dashboard/students', icon: Users },
      ]
    }

    if (role === 'student') {
      return [
        ...baseItems,
        { name: 'Khóa học', href: '/dashboard/courses', icon: BookOpen },
        { name: 'Khóa học của tôi', href: '/dashboard/learning', icon: GraduationCap },
      ]
    }

    return baseItems // for pending/rejected
  }

  const navItems = getNavItems()

  return (
    <div className="w-[var(--sidebar-width)] h-screen bg-[#103C11] text-white flex flex-col fixed left-0 top-0 overflow-y-auto border-r border-[#1e5c20]">
      <div className="p-6 flex flex-col items-center border-b border-[#1e5c20]">
        <div className="relative w-24 h-24 mb-3 bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Inspiring HR Logo" 
            width={80} 
            height={80}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-lg font-black text-[#C7A959] tracking-wide text-center">Inspiring HR</h2>
        <p className="text-[10px] text-gray-300 mt-1.5 uppercase tracking-widest font-bold bg-[#1e5c20] px-2.5 py-0.5 rounded-full">{role} PORTAL</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#1e5c20] text-[#C7A959] font-medium' 
                  : 'text-gray-300 hover:bg-[#1e5c20] hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#C7A959]' : 'text-gray-400'} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-[#1e5c20]">
        <form action="/actions/auth" method="POST">
          {/* We'll use a link to sign out or an action button */}
          <Link 
            href="/login" // We'll replace this with proper logout later
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} className="text-gray-400" />
            <span>Đăng xuất</span>
          </Link>
        </form>
      </div>
    </div>
  )
}

