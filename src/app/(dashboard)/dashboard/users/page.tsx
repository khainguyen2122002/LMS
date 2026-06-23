import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UserList from '@/components/admin/UserList'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard') // Or to an unauthorized page
  }

  // Fetch all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, company, position, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h1>
        <p className="text-gray-500">Phê duyệt và phân quyền cho học viên, giảng viên.</p>
      </div>

      <UserList initialUsers={users || []} />
    </div>
  )
}
