import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementTable from '@/components/admin/UserManagementTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Double check admin role, though middleware should have handled it
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Lấy danh sách users, sort pending lên đầu
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true }) // trick: 'admin', 'lecturer', 'pending', 'rejected', 'student'
    // Actually, pending is 'p', so it's not strictly first. Let's sort by created_at in JS if we want, or just created_at desc
    .order('created_at', { ascending: false })

  // Tùy chỉnh sort JS để pending lên đầu và map is_active an toàn
  const sortedUsers = [...(users || [])]
    .map(u => ({
      ...u,
      is_active: u.is_active !== false // Mặc định là true nếu là null hoặc true, chỉ false nếu được set false
    }))
    .sort((a, b) => {
      if (a.role === 'pending' && b.role !== 'pending') return -1;
      if (a.role !== 'pending' && b.role === 'pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
        <p className="text-gray-600 mt-2">Duyệt và phân quyền truy cập cho học viên và giảng viên.</p>
      </div>

      <UserManagementTable initialUsers={sortedUsers} />
    </div>
  )
}
