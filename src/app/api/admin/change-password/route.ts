import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { getConfigWithDefault } from '@/lib/config-service'

export async function POST(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        message: '当前密码和新密码不能为空'
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        message: '新密码长度不能少于6位'
      }, { status: 400 })
    }

    // 从数据库获取当前管理员信息
    const admin = await prisma.admin.findUnique({
      where: { username: authResult.payload?.username }
    })

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: '管理员账号不存在'
      }, { status: 404 })
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        message: '当前密码不正确'
      }, { status: 400 })
    }

    // 生成新密码哈希
    const bcryptRounds = await getConfigWithDefault('bcryptRounds')
    const newPasswordHash = await bcrypt.hash(newPassword, bcryptRounds)

    // 更新数据库中的密码
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: newPasswordHash }
    })

    return NextResponse.json({
      success: true,
      message: '密码修改成功，请重新登录'
    })

  } catch (error) {
    console.error('密码修改失败:', error)
    return NextResponse.json({
      success: false,
      message: '密码修改失败，请重试'
    }, { status: 500 })
  }
} 