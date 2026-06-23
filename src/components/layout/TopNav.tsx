'use client'

import { Bell, Menu, UserCircle } from 'lucide-react'

interface TopNavProps {
  userEmail: string
  userName: string
}

export default function TopNav({ userEmail, userName }: TopNavProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Mobile menu button (hidden on desktop) */}
        <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
          {/* We can put page title here dynamically later */}
          Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 relative rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-700">{userName || 'Người dùng'}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#e6f0e7] text-[#103C11] flex items-center justify-center font-bold">
            {userName ? userName.charAt(0).toUpperCase() : <UserCircle size={24} />}
          </div>
        </div>
      </div>
    </header>
  )
}

