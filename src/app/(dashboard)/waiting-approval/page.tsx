import Link from 'next/link'
import { signout } from '@/app/actions/auth'

export default function WaitingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        <div>
          <div className="mx-auto h-12 w-12 text-[#C7A959] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đang Chờ Phê Duyệt
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600">
            Tài khoản của bạn đã được ghi nhận và đang trong quá trình chờ Ban Quản trị phê duyệt.
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Chúng tôi sẽ gửi email thông báo cho bạn ngay khi tài khoản được cấp quyền truy cập đầy đủ.
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

