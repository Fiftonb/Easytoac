import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'
import { getConfigWithDefault } from './config-service'

export async function verifyAuth(request: NextRequest): Promise<{ success: boolean; error?: string; payload?: any }> {
  try {
    // 获取客户端IP
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    
    // 从数据库获取IP白名单配置
    const allowedIPs = await getConfigWithDefault('allowedIPs')
    
    // IP白名单检查
    if (process.env.NODE_ENV === 'production' && !allowedIPs.includes(clientIP)) {
      return {
        success: false,
        error: '访问被拒绝: IP地址不在白名单中'
      }
    }
    
    // JWT验证
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return {
        success: false,
        error: '未提供认证令牌'
      }
    }
    
    const payload = await verifyToken(token)
    if (!payload) {
      return {
        success: false,
        error: '无效的认证令牌'
      }
    }
    
    return {
      success: true,
      payload
    }
  } catch (error) {
    console.error('认证验证失败:', error)
    return {
      success: false,
      error: '认证验证失败'
    }
  }
}

export function createAuthResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { success: false, message: error },
    { status }
  )
} 