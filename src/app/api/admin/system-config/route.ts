import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthResponse } from '@/lib/auth-middleware'
import { getAllConfigsWithMeta, setConfig } from '@/lib/config-service'

// 获取所有系统配置
export async function GET(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    const configs = await getAllConfigsWithMeta()
    
    return NextResponse.json({
      success: true,
      configs
    })

  } catch (error) {
    console.error('获取系统配置失败:', error)
    return NextResponse.json({
      success: false,
      message: '获取系统配置失败'
    }, { status: 500 })
  }
}

// 更新系统配置
export async function POST(request: NextRequest) {
  try {
    // 使用认证中间件验证
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return createAuthResponse(authResult.error || '认证失败', 401)
    }

    const { configs } = await request.json()

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({
        success: false,
        message: '配置数据格式错误'
      }, { status: 400 })
    }

    // 批量更新配置
    for (const config of configs) {
      await setConfig(config.key, config.value, config.description)
    }

    return NextResponse.json({
      success: true,
      message: '系统配置更新成功'
    })

  } catch (error) {
    console.error('更新系统配置失败:', error)
    return NextResponse.json({
      success: false,
      message: '更新系统配置失败'
    }, { status: 500 })
  }
} 