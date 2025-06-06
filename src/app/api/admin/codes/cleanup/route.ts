import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    // 清理过期激活码的绑定关系
    // 将过期且已使用的激活码重置为未使用状态，以便机器可以使用新激活码
    
    const now = new Date()
    
    // 查找所有过期且已使用的激活码
    const expiredCodes = await prisma.activationCode.findMany({
      where: {
        isUsed: true,
        expiresAt: {
          lt: now // 过期时间小于当前时间
        }
      }
    })
    
    if (expiredCodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有找到需要清理的过期激活码',
        cleaned: 0
      })
    }
    
    // 重置过期激活码的使用状态
    const result = await prisma.activationCode.updateMany({
      where: {
        isUsed: true,
        expiresAt: {
          lt: now
        }
      },
      data: {
        isUsed: false,
        usedAt: null,
        usedBy: null
      }
    })
    
    console.log(`清理了 ${result.count} 个过期激活码的绑定关系`)
    
    return NextResponse.json({
      success: true,
      message: `成功清理了 ${result.count} 个过期激活码的绑定关系`,
      cleaned: result.count,
      expiredCodes: expiredCodes.map((code: any) => ({
        code: code.code,
        usedBy: code.usedBy,
        expiresAt: code.expiresAt
      }))
    })

  } catch (error) {
    console.error('清理过期激活码时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 获取过期激活码统计
export async function GET(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    const now = new Date()
    
    // 查找所有过期且已使用的激活码
    const expiredCodes = await prisma.activationCode.findMany({
      where: {
        isUsed: true,
        expiresAt: {
          lt: now
        }
      },
      select: {
        id: true,
        code: true,
        usedBy: true,
        usedAt: true,
        expiresAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      count: expiredCodes.length,
      expiredCodes
    })

  } catch (error) {
    console.error('获取过期激活码时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 