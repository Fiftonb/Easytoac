import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

// 定义激活码类型
interface ActivationCodeData {
  id: number
  code: string
  isUsed: boolean
  usedAt: Date | null
  usedBy: string | null
  createdAt: Date
  expiresAt: Date | null
  validDays: number | null
}

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
    
    // 查找所有已使用的激活码
    const usedCodes = await prisma.activationCode.findMany({
      where: {
        isUsed: true
      },
      select: {
        id: true,
        code: true,
        isUsed: true,
        usedAt: true,
        usedBy: true,
        createdAt: true,
        expiresAt: true,
        validDays: true
      }
    })
    
    // 筛选出真正过期的激活码
    const expiredCodes = usedCodes.filter((code: ActivationCodeData) => {
      if (code.usedAt && code.validDays) {
        // 从激活时开始计算过期时间
        const actualExpiresAt = new Date(code.usedAt.getTime() + code.validDays * 24 * 60 * 60 * 1000)
        return actualExpiresAt < now
      } else if (code.expiresAt) {
        // 兼容旧数据
        return code.expiresAt < now
      }
      return false
    })
    
    if (expiredCodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有找到需要清理的过期激活码',
        cleaned: 0
      })
    }
    
    // 重置过期激活码的使用状态
    const expiredCodeIds = expiredCodes.map((code: ActivationCodeData) => code.id)
    const result = await prisma.activationCode.updateMany({
      where: {
        id: {
          in: expiredCodeIds
        }
      },
      data: {
        isUsed: false,
        usedAt: null,
        usedBy: null,
        expiresAt: null  // 清空过期时间，等待下次激活时重新设置
      }
    })
    
    console.log(`清理了 ${result.count} 个过期激活码的绑定关系`)
    
    return NextResponse.json({
      success: true,
      message: `成功清理了 ${result.count} 个过期激活码的绑定关系`,
      cleaned: result.count,
      expiredCodes: expiredCodes.map((code: ActivationCodeData) => ({
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
    
    // 查找所有已使用的激活码
    const usedCodes = await prisma.activationCode.findMany({
      where: {
        isUsed: true
      },
      select: {
        id: true,
        code: true,
        isUsed: true,
        usedAt: true,
        usedBy: true,
        createdAt: true,
        expiresAt: true,
        validDays: true
      }
    })
    
    // 筛选出真正过期的激活码
    const expiredCodes = usedCodes.filter((code: ActivationCodeData) => {
      if (code.usedAt && code.validDays) {
        // 从激活时开始计算过期时间
        const actualExpiresAt = new Date(code.usedAt.getTime() + code.validDays * 24 * 60 * 60 * 1000)
        return actualExpiresAt < now
      } else if (code.expiresAt) {
        // 兼容旧数据
        return code.expiresAt < now
      }
      return false
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