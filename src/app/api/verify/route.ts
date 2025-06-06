import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code, machine_id } = await request.json()

    if (!code || !machine_id) {
      return NextResponse.json(
        { success: false, message: '激活码和机器ID不能为空' },
        { status: 400 }
      )
    }

    // 首先检查该机器是否已经使用过其他激活码（一机器一码限制）
    const existingActivation = await prisma.activationCode.findFirst({
      where: {
        usedBy: machine_id,
        isUsed: true
      }
    })

    if (existingActivation) {
      const now = new Date()
      const isExistingExpired = existingActivation.expiresAt && existingActivation.expiresAt < now

      // 如果使用的是同一个激活码
      if (existingActivation.code === code) {
        // 检查激活码是否过期
        if (isExistingExpired) {
          return NextResponse.json(
            { success: false, message: '激活码已过期' },
            { status: 400 }
          )
        }
        // 未过期，允许重复验证
        return NextResponse.json({
          success: true,
          message: '激活码验证成功（重复验证）',
          expires_at: existingActivation.expiresAt
        })
      } else {
        // 如果使用的是不同激活码
        if (isExistingExpired) {
          // 如果当前绑定的激活码已过期，允许使用新激活码
          console.log(`机器 ${machine_id} 的激活码 ${existingActivation.code} 已过期，允许使用新激活码`)
          // 继续执行后面的新激活码验证逻辑
        } else {
          // 如果当前绑定的激活码还有效，拒绝验证
          return NextResponse.json(
            { success: false, message: `该设备已激活过激活码: ${existingActivation.code}，一台设备只能使用一个激活码` },
            { status: 400 }
          )
        }
      }
    }

    // 查找要验证的激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: { code }
    })

    if (!activationCode) {
      return NextResponse.json(
        { success: false, message: '激活码不存在' },
        { status: 404 }
      )
    }

    // 检查是否过期
    if (activationCode.expiresAt && activationCode.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: '激活码已过期' },
        { status: 400 }
      )
    }

    // 检查是否已被其他设备使用
    if (activationCode.isUsed) {
      return NextResponse.json(
        { success: false, message: '激活码已被其他设备使用' },
        { status: 400 }
      )
    }

    // 首次使用，更新激活码状态
    await prisma.activationCode.update({
      where: { code },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: machine_id
      }
    })

    return NextResponse.json({
      success: true,
      message: '激活码验证成功',
      expires_at: activationCode.expiresAt
    })

  } catch (error) {
    console.error('验证激活码时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 