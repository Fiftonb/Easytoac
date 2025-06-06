import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initSystemConfig() {
  try {
    // 检查是否已经存在配置
    const existingConfigs = await prisma.systemConfig.findMany()
    
    if (existingConfigs.length > 0) {
      console.log('系统配置已存在，跳过初始化')
      return
    }

    // 初始化默认配置
    const defaultConfigs = [
      {
        key: 'allowedIPs',
        value: JSON.stringify(['127.0.0.1', '::1']),
        description: 'IP白名单列表'
      },
      {
        key: 'jwtSecret',
        value: '72a99ef4352d55f8c6c5bdbe8a54e0d58df60740e229318cbc2dea4154ef48dd',
        description: 'JWT密钥'
      },
      {
        key: 'jwtExpiresIn',
        value: '24h',
        description: 'JWT过期时间'
      },
      {
        key: 'bcryptRounds',
        value: '12',
        description: 'bcrypt加密强度'
      },
      {
        key: 'systemName',
        value: '激活码管理系统',
        description: '系统名称'
      }
    ]

    await prisma.systemConfig.createMany({
      data: defaultConfigs
    })

    console.log('✅ 系统配置初始化成功!')
    console.log('默认配置项：')
    defaultConfigs.forEach(config => {
      console.log(`- ${config.key}: ${config.description}`)
    })

  } catch (error) {
    console.error('❌ 初始化系统配置失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initSystemConfig() 