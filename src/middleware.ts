import { NextRequest, NextResponse } from 'next/server'

// 默认允许的IP地址列表（可以从环境变量或配置文件读取）
const DEFAULT_ALLOWED_IPS = ['127.0.0.1', '::1', '0.0.0.0']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查是否需要IP白名单验证
  if (pathname.startsWith('/admin')) {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    
    // 使用默认IP白名单（在中间件中不访问数据库）
    // 如果需要动态IP管理，可以通过API路由在客户端验证
    const allowedIPs = process.env.ALLOWED_IPS ? 
      process.env.ALLOWED_IPS.split(',').map(ip => ip.trim()) : 
      DEFAULT_ALLOWED_IPS
    
    // IP白名单检查 - 在开发环境下放宽限制
    if (process.env.NODE_ENV === 'production' && !allowedIPs.includes(clientIP)) {
      return NextResponse.json(
        { error: '访问被拒绝: IP地址不在白名单中' },
        { status: 403 }
      )
    }
    
    // 如果是登录页面，不需要JWT验证
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }
    
    // JWT验证
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // 简单的JWT验证（在中间件中不访问数据库配置）
    try {
      // 这里我们先允许通过，具体的JWT验证在API路由中进行
      // 因为在中间件中验证JWT需要访问数据库配置
      const response = NextResponse.next()
      response.headers.set('x-middleware-cache', 'no-cache')
      return response
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 