import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = getSessionCookie(request.headers)

  // If no session cookie exists, redirect to sign-in with return URL
  if (!sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url)
    // Preserve the intended destination for redirect after login
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Session cookie exists, allow request to proceed
  return NextResponse.next()
}

// Configure middleware to run on all routes except:
// - API routes (/api/*)
// - Next.js internals (_next/*)
// - Static files (files with extensions)
// - Favicon
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g., .png, .jpg, .svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
