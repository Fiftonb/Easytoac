import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/jwt'
import { prisma } from '@/lib/db'
import { config as appConfig } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 从数据库查找管理员
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 生成JWT token
    const token = await signToken({ username, isAdmin: true })

    // 设置httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: '登录成功'
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: appConfig.server.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24小时
    })

    return response

  } catch (error) {
    console.error('登录时发生错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 