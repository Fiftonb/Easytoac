import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getConfigWithDefault } from '../src/lib/config-service'

const prisma = new PrismaClient()

async function initDefaultAdmin() {
  try {
    // 检查是否已经存在管理员
    const existingAdmin = await prisma.admin.findFirst()
    
    if (existingAdmin) {
      console.log('管理员账号已存在，跳过初始化')
      return
    }

    // 创建默认管理员账号
    const defaultPassword = '123456'
    const bcryptRounds = await getConfigWithDefault('bcryptRounds')
    const hashedPassword = await bcrypt.hash(defaultPassword, bcryptRounds)

    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })

    console.log('✅ 默认管理员账号创建成功!')
    console.log('用户名: admin')
    console.log('密码: 123456')
    console.log('请登录后及时修改密码！')

  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initDefaultAdmin() 