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

    // 获取所有激活码
    const allCodes = await prisma.activationCode.findMany({
      select: {
        isUsed: true,
        expiresAt: true,
      }
    })

    const now = new Date()
    
    interface CodeData {
      isUsed: boolean;
      expiresAt: Date | null;
    }
    
    const stats = {
      total: allCodes.length,
      used: allCodes.filter((code: CodeData) => code.isUsed).length,
      expired: allCodes.filter((code: CodeData) => 
        code.expiresAt && 
        new Date(code.expiresAt) < now && 
        !code.isUsed
      ).length,
      active: allCodes.filter((code: CodeData) => 
        !code.isUsed && 
        (!code.expiresAt || new Date(code.expiresAt) > now)
      ).length
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('获取统计数据时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 