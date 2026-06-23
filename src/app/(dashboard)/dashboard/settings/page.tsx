import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/settings/SettingsForm'

export const metadata = {
  title: 'Cài đặt tài khoản | Inspiring HR LMS',
  description: 'Cập nhật thông tin hồ sơ cá nhân và tài khoản của bạn.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt tài khoản</h1>
        <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin hồ sơ cá nhân của bạn.</p>
      </div>
      <SettingsForm profile={profile} userEmail={user.email || ''} />
    </div>
  )
}
