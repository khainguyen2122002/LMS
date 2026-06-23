import Link from 'next/link'
import { signout } from '@/app/actions/auth'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccessDeniedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rejection_reason')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        <div>
          <div className="mx-auto h-12 w-12 text-red-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Truy Cập Bị Từ Chối
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600">
            Rất tiếc, yêu cầu truy cập hệ thống LMS của bạn không được phê duyệt.
          </p>
          {profile?.rejection_reason && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-sm font-semibold text-red-800">Lý do từ chối:</p>
              <p className="text-sm text-red-700 mt-1">{profile.rejection_reason}</p>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-gray-600">
            Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ Hotline: <strong className="text-gray-900">0915099642</strong> để được hỗ trợ.
          </p>
        </div>
        
        <div className="mt-8 flex flex-col space-y-4">
          <Link href="/" className="text-sm font-medium text-[#103C11] hover:underline">
            Trở về Trang Chủ
          </Link>
          <form action={signout}>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Đăng Xuất
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

