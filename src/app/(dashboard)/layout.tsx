import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ============================================================
  // DEV PREVIEW MODE: Đọc cookie để giả lập role mà không cần login
  // Kích hoạt bằng cách truy cập: /dashboard?preview=student
  // ============================================================
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies()
    const previewRole = cookieStore.get('dev_preview_role')?.value
    if (previewRole && ['student', 'admin', 'lecturer'].includes(previewRole)) {
      const PREVIEW_NAMES: Record<string, string> = {
        student: 'Học Viên (Preview)',
        admin: 'Admin (Preview)',
        lecturer: 'Giảng Viên (Preview)',
      }
      return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          {/* Banner cảnh báo Preview Mode */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-center text-xs font-bold py-1 px-4">
            🔍 DEV PREVIEW MODE — Đang xem giao diện: <strong>{previewRole.toUpperCase()}</strong>
            &nbsp;|&nbsp;
            <a href="/dashboard" className="underline">Thoát Preview</a>
          </div>
          <div className="flex w-full mt-6">
            <Sidebar role={previewRole as any} />
            <div className="flex-1 flex flex-col ml-[var(--sidebar-width)] transition-all duration-300">
              <TopNav userEmail={`preview-${previewRole}@dev.local`} userName={PREVIEW_NAMES[previewRole]} />
              <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      )
    }
  }

  const supabase = await createClient()

  // Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // If profile doesn't exist yet, we might want to redirect to a setup page or show pending
    // For now, we'll assume pending if not found (though trigger should create it)
  }

  const role = profile?.role || 'pending'
  const userName = profile?.full_name || user.email?.split('@')[0] || ''

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed on the left */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-[var(--sidebar-width)] transition-all duration-300">
        <TopNav userEmail={user.email || ''} userName={userName} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
