import { NextRequest, NextResponse } from 'next/server'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'

export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/check-iframe', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/check-iframe', true)
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'URL is required' 
      }, { status: 400 })
    }

    // Validate URL format
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid URL format' 
      }, { status: 400 })
    }

    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only HTTP and HTTPS URLs are allowed' 
      }, { status: 400 })
    }

    // Create AbortController with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      // Try to fetch the URL with HEAD request first (more efficient)
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; iframe-checker/1.0)',
          'Accept': '*/*'
        },
        // Don't follow redirects automatically
        redirect: 'manual'
      })

      clearTimeout(timeoutId)

      // Check if it's a redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) {
          return NextResponse.json({
            success: true,
            message: `URL redirects to: ${location}`,
            status: response.status,
            redirectTo: location
          })
        }
      }

      // Check for common iframe-blocking headers
      const xFrameOptions = response.headers.get('x-frame-options')
      const csp = response.headers.get('content-security-policy')
      
      let warnings = []
      
      if (xFrameOptions) {
        const xFrameValue = xFrameOptions.toLowerCase()
        if (xFrameValue === 'deny' || xFrameValue === 'sameorigin') {
          warnings.push(`X-Frame-Options: ${xFrameOptions} may block iframe embedding`)
        }
      }
      
      if (csp && csp.includes('frame-ancestors')) {
        warnings.push('Content-Security-Policy frame-ancestors may block iframe embedding')
      }

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'URL is accessible',
          status: response.status,
          warnings: warnings.length > 0 ? warnings : undefined
        })
      } else if (response.status === 405) {
        // Method not allowed for HEAD, try GET
        try {
          const getResponse = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; iframe-checker/1.0)',
              'Accept': 'text/html,application/xhtml+xml'
            }
          })

          if (getResponse.ok) {
            return NextResponse.json({
              success: true,
              message: 'URL is accessible (via GET)',
              status: getResponse.status,
              warnings: warnings.length > 0 ? warnings : undefined
            })
          } else {
            return NextResponse.json({
              success: false,
              error: `HTTP ${getResponse.status}: ${getResponse.statusText}`,
              status: getResponse.status
            })
          }
        } catch (getError) {
          return NextResponse.json({
            success: false,
            error: `Failed to fetch with GET: ${getError instanceof Error ? getError.message : 'Unknown error'}`,
            status: response.status
          })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        })
      }

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Request timeout (10 seconds)'
        })
      }

      return NextResponse.json({
        success: false,
        error: `Network error: ${fetchError.message || 'Failed to connect'}`
      })
    }

  } catch (error) {
    console.error('Error in check-iframe API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}