import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_PREVIEW_ROLES = ['student', 'admin', 'lecturer'] as const
type PreviewRole = typeof VALID_PREVIEW_ROLES[number]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // ============================================================
  // DEV PREVIEW MODE: bypass auth khi có query param ?preview=role
  // Chỉ hoạt động trong môi trường development (NODE_ENV=development)
  // Ví dụ: http://localhost:3001/dashboard?preview=student
  //        http://localhost:3001/dashboard/admin?preview=admin
  // ============================================================
  if (process.env.NODE_ENV === 'development') {
    const previewRole = url.searchParams.get('preview') as PreviewRole | null

    if (previewRole && VALID_PREVIEW_ROLES.includes(previewRole)) {
      // Inject cookie vào REQUEST HEADERS để Server Components đọc được ngay trong request này
      const requestHeaders = new Headers(request.headers)
      const existingCookies = requestHeaders.get('cookie') || ''
      const newCookieStr = `dev_preview_role=${previewRole}`
      requestHeaders.set('cookie', existingCookies ? `${existingCookies}; ${newCookieStr}` : newCookieStr)

      const response = NextResponse.next({ request: { headers: requestHeaders } })
      // Cũng set vào response để cookie tồn tại khi navigate sang trang khác
      response.cookies.set('dev_preview_role', previewRole, { path: '/', httpOnly: false, maxAge: 3600 })
      return response
    }

    // Nếu đã có cookie preview (đang navigate trong preview mode) → tiếp tục bypass
    const existingPreviewRole = request.cookies.get('dev_preview_role')?.value
    if (existingPreviewRole && VALID_PREVIEW_ROLES.includes(existingPreviewRole as PreviewRole)) {
      return NextResponse.next({ request })
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect /register to /login
  if (pathname.startsWith('/register')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Bỏ qua check cho auth routes và các public routes
  if (
    pathname.startsWith('/login') ||
    pathname === '/' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return supabaseResponse
  }

  // CheckAuth: Nếu chưa login mà vào /dashboard hoặc các trang cần auth
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/waiting-approval') || pathname.startsWith('/access-denied'))) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Lấy profile để kiểm tra role và trạng thái hoạt động
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    const isActive = profile ? profile.is_active : true

    // Check Trạng thái Hoạt động
    if (isActive === false) {
      url.pathname = '/login'
      url.searchParams.set('error', 'inactive')
      const response = NextResponse.redirect(url)
      
      // Xóa session cookies của Supabase
      const allCookies = request.cookies.getAll()
      allCookies.forEach(cookie => {
        if (cookie.name.includes('-auth-token') || cookie.name.includes('sb-')) {
          response.cookies.delete(cookie.name)
        }
      })
      return response
    }

    const role = profile?.role || 'pending'

    // CheckStatus Flow
    if (role === 'pending' && pathname !== '/waiting-approval') {
      url.pathname = '/waiting-approval'
      return NextResponse.redirect(url)
    }

    if (role === 'rejected' && pathname !== '/access-denied') {
      url.pathname = '/access-denied'
      return NextResponse.redirect(url)
    }

    // Nếu đã approve nhưng lại vào trang báo lỗi
    if ((role === 'student' || role === 'lecturer' || role === 'admin') &&
        (pathname === '/waiting-approval' || pathname === '/access-denied')) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // CheckRole Flow
    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/dashboard/lecturer') && role !== 'lecturer' && role !== 'admin') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
