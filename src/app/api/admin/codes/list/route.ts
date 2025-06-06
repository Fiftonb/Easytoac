import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    // 获取所有激活码，按创建时间倒序排列
    const codes = await prisma.activationCode.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      codes
    })

  } catch (error) {
    console.error('获取激活码列表时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 