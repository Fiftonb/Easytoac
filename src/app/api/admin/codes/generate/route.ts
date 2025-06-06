import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

function generateActivationCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    const { amount, expiryDays, cardType } = await request.json()

    if (!amount || amount < 1 || amount > 100) {
      return NextResponse.json(
        { success: false, message: '生成数量必须在1-100之间' },
        { status: 400 }
      )
    }

    const codes = []
    // 不再预设过期时间，而是存储有效天数，从激活时开始计算
    // const expiresAt = expiryDays 
    //   ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    //   : null

    for (let i = 0; i < amount; i++) {
      let code: string
      let isUnique = false
      
      // 确保生成的激活码是唯一的
      do {
        code = generateActivationCode()
        const existing = await prisma.activationCode.findUnique({
          where: { code }
        })
        isUnique = !existing
      } while (!isUnique)

      const activationCode = await prisma.activationCode.create({
        data: {
          code: code!,
          validDays: expiryDays || null,  // 存储有效天数，从激活时开始计算
          cardType: cardType || null,     // 存储套餐类型
          expiresAt: null  // 初始时不设置过期时间
        }
      })

      codes.push({
        id: activationCode.id,
        code: activationCode.code,
        validDays: activationCode.validDays,
        cardType: activationCode.cardType,
        expiresAt: activationCode.expiresAt,
        createdAt: activationCode.createdAt
      })
    }

    return NextResponse.json({
      success: true,
      message: `成功生成 ${amount} 个${cardType ? cardType : ''}激活码`,
      codes
    })

  } catch (error) {
    console.error('生成激活码时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 