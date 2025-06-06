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
        usedAt: true,
        validDays: true,
      }
    })

    const now = new Date()
    
    interface CodeData {
      isUsed: boolean;
      expiresAt: Date | null;
      usedAt: Date | null;
      validDays: number | null;
    }
    
    // 计算实际过期时间的辅助函数
    const getActualExpiresAt = (code: CodeData): Date | null => {
      if (code.usedAt && code.validDays) {
        return new Date(code.usedAt.getTime() + code.validDays * 24 * 60 * 60 * 1000)
      }
      return code.expiresAt // 兼容旧数据
    }
    
    const stats = {
      total: allCodes.length,
      used: allCodes.filter((code: CodeData) => code.isUsed).length,
      expired: allCodes.filter((code: CodeData) => {
        if (code.isUsed) {
          // 已使用的激活码，检查是否过期
          const actualExpiresAt = getActualExpiresAt(code)
          return actualExpiresAt && actualExpiresAt < now
        } else {
          // 未使用的激活码不算过期（因为过期时间从激活开始计算）
          return false
        }
      }).length,
      active: allCodes.filter((code: CodeData) => {
        if (code.isUsed) {
          // 已使用但未过期的激活码
          const actualExpiresAt = getActualExpiresAt(code)
          return !actualExpiresAt || actualExpiresAt > now
        } else {
          // 未使用的激活码都算作可用
          return true
        }
      }).length
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