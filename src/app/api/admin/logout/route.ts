import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: '已成功登出'
  })

  // 清除认证cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })

  return response
} 