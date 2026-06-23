'use client'

import { useState } from 'react'
import { updateUserRole, toggleUserStatus } from '@/app/actions/users'
import { Plus, UserX, UserCheck, ShieldAlert } from 'lucide-react'
import AddUserModal from './AddUserModal'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  role: string
  rejection_reason?: string | null
  is_active: boolean
}

export default function UserManagementTable({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedRole, setSelectedRole] = useState('student')

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setSelectedUserId(userId)
    if (action === 'approve') {
      setSelectedRole('student')
      setApproveModalOpen(true)
    } else {
      setRejectionReason('')
      setRejectModalOpen(true)
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setLoading(userId)
    setError(null)
    const newStatus = !currentStatus
    
    try {
      const result = await toggleUserStatus(userId, newStatus)
      if (result.error) {
        setError(result.error)
      } else {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u))
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối.')
    } finally {
      setLoading(null)
    }
  }

  const submitApprove = async () => {
    if (!selectedUserId) return
    setLoading(selectedUserId)
    setError(null)
    setApproveModalOpen(false)

    const result = await updateUserRole(selectedUserId, selectedRole)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, role: selectedRole } : u))
    }
    setLoading(null)
  }

  const submitReject = async () => {
    if (!selectedUserId || !rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối')
      return
    }
    setLoading(selectedUserId)
    setError(null)
    setRejectModalOpen(false)

    const result = await updateUserRole(selectedUserId, 'rejected', rejectionReason)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, role: 'rejected', rejection_reason: rejectionReason } : u))
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {/* Control panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <span className="text-sm font-semibold text-gray-500">Tổng số: {users.length} người dùng</span>
        <button
          onClick={() => setAddModalOpen(true)}
          className="text-white bg-[#103C11] hover:bg-[#1e5c20] px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm thành viên</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Học viên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Công việc</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hoạt động</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={user.role === 'pending' ? 'bg-yellow-50/40' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{user.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.position || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.company || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold uppercase rounded-full 
                      ${user.role === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        user.role === 'rejected' ? 'bg-red-100 text-red-800' : 
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                    {user.role === 'rejected' && user.rejection_reason && (
                      <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={user.rejection_reason}>
                        Lý do: {user.rejection_reason}
                      </div>
                    )}
                  </td>
                  
                  {/* Cột Hoạt Động (Toggle Switch) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={user.role === 'admin' || loading === user.id}
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#103C11] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                        user.is_active ? 'bg-[#103C11]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          user.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {loading === user.id ? (
                      <span className="text-gray-400 text-xs">Đang xử lý...</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {user.role !== 'admin' && (
                          <>
                            {user.role === 'pending' && (
                              <button
                                onClick={() => handleAction(user.id, 'approve')}
                                className="text-white bg-[#103C11] hover:bg-[#1e5c20] px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Duyệt
                              </button>
                            )}
                            {user.role !== 'rejected' && (
                              <button
                                onClick={() => handleAction(user.id, 'reject')}
                                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Từ chối
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Approve Modal */}
        {approveModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-[#103C11]">Phê duyệt tài khoản</h3>
              <p className="text-sm text-gray-600 mb-4">Chọn quyền truy cập cho người dùng này:</p>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border rounded-lg p-2.5 mb-6 outline-none focus:ring-2 focus:ring-[#103C11] focus:border-transparent text-sm bg-white"
              >
                <option value="student">Học viên (Student)</option>
                <option value="lecturer">Giảng viên (Lecturer)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setApproveModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button 
                  onClick={submitApprove}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#103C11] rounded-lg hover:bg-[#1e5c20]"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-red-600">Từ chối tài khoản</h3>
              <p className="text-sm text-gray-600 mb-2">Vui lòng nhập lý do từ chối (sẽ được gửi qua email cho người dùng):</p>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border rounded-lg p-2.5 mb-6 h-24 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                placeholder="Ví dụ: Thông tin công ty không hợp lệ..."
                required
              ></textarea>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button 
                  onClick={submitReject}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          // Tự động reload để Next.js fetch lại danh sách qua Server Component
          window.location.reload()
        }}
      />
    </div>
  )
}

