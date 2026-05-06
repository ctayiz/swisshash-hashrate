import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']
const AUTH_PATHS = ['/login', '/register']
const CUSTOMER_PATHS = ['/dashboard', '/packages', '/orders', '/pool-config']
const ADMIN_PREFIX = '/admin'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate JWT server-side — never trust getSession() alone
  const { data: { user } } = await supabase.auth.getUser()

  // Read role directly from profiles table (reliable, no JWT hook dependency)
  let role = 'customer'
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? 'customer'
  }

  const { pathname } = request.nextUrl

  // Internal API routes secured by secret headers — skip session check
  if (pathname.startsWith('/api/proxy/rebuild')) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.REBUILD_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return supabaseResponse
  }

  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return supabaseResponse
  }

  // Public API routes (Stripe webhook, auth callback)
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/stripe/webhook')
  ) {
    return supabaseResponse
  }

  // Authenticated user on auth pages → redirect to dashboard
  if (user && AUTH_PATHS.some(p => pathname === p)) {
    const redirectTo = role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return supabaseResponse
  }

  // All other routes require authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes: require admin role
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Customer routes: any authenticated user
  if (CUSTOMER_PATHS.some(p => pathname.startsWith(p))) {
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
