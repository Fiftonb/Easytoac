import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: '激活码ID不能为空' },
        { status: 400 }
      )
    }

    // 检查激活码是否存在
    const existingCode = await prisma.activationCode.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCode) {
      return NextResponse.json(
        { success: false, message: '激活码不存在' },
        { status: 404 }
      )
    }

    // 删除激活码
    await prisma.activationCode.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: '激活码删除成功'
    })

  } catch (error) {
    console.error('删除激活码时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 