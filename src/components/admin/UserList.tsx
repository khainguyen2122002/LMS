'use client'

import { useState } from 'react'
import { updateUserRole } from '@/app/actions/users'
import { Check, X, Shield, GraduationCap, BookOpen, Clock } from 'lucide-react'

type Profile = {
  id: string
  email: string
  full_name: string
  role: string
  company: string
  position: string
  created_at: string
}

interface UserListProps {
  initialUsers: Profile[]
}

export default function UserList({ initialUsers }: UserListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setLoadingId(userId)
    const result = await updateUserRole(userId, newRole)
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      alert(result.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center"><Shield size={12} className="mr-1"/> Admin</span>
      case 'lecturer':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center"><BookOpen size={12} className="mr-1"/> Giảng viên</span>
      case 'student':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center"><GraduationCap size={12} className="mr-1"/> Học viên</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs flex items-center"><Clock size={12} className="mr-1"/> Chờ duyệt</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Đã từ chối</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{role}</span>
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Người dùng</th>
              <th className="px-6 py-4">Công việc</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Ngày đăng ký</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Không có người dùng nào
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{user.position || '-'}</div>
                    <div className="text-gray-500">{user.company || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {loadingId === user.id ? (
                      <span className="text-gray-400">Đang xử lý...</span>
                    ) : (
                      <>
                        {user.role === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateRole(user.id, 'student')}
                              className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                              title="Duyệt làm Học viên"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleUpdateRole(user.id, 'rejected')}
                              className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                              title="Từ chối"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {user.role !== 'pending' && user.role !== 'admin' && (
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#103C11]"
                          >
                            <option value="student">Học viên</option>
                            <option value="lecturer">Giảng viên</option>
                            <option value="admin">Admin</option>
                            <option value="rejected">Khóa</option>
                          </select>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

