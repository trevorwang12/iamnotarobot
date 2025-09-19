import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy (较宽松，避免扩展冲突)
  const csp = [
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
    "style-src 'self' 'unsafe-inline' https: data:",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https: data:",
    "frame-src https: data:",
    "connect-src 'self' https: data:",
    "media-src 'self' https: data:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
  
  // 在开发环境中不应用严格的CSP
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', csp)
  }
  
  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Add additional security headers for admin routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Block admin access from certain user agents (basic bot protection)
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
    const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper']
    
    if (suspiciousAgents.some(agent => userAgent.includes(agent))) {
      return new NextResponse('Access Denied', { status: 403 })
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}