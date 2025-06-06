import bcrypt from 'bcryptjs'
import crypto from 'crypto'

async function initAdmin() {
  const username = 'admin'
  const password = crypto.randomBytes(8).toString('hex')
  const hashedPassword = await bcrypt.hash(password, 12)
  const jwtSecret = crypto.randomBytes(32).toString('hex')

  console.log('\n========== 激活码管理系统初始化 ==========')
  console.log(`管理员用户名: ${username}`)
  console.log(`管理员密码: ${password}`)
  console.log(`密码哈希: ${hashedPassword}`)
  console.log(`JWT密钥: ${jwtSecret}`)
  console.log('\n请将以下内容添加到您的 .env 文件中:')
  console.log('=====================================')
  console.log(`DATABASE_URL="file:./dev.db"`)
  console.log(`ADMIN_USERNAME="${username}"`)
  console.log(`ADMIN_PASSWORD_HASH="${hashedPassword}"`)
  console.log(`JWT_SECRET="${jwtSecret}"`)
  console.log(`ALLOWED_IPS="127.0.0.1,::1"`)
  console.log('=====================================')
  console.log('\n请保存好管理员密码，系统不会再次显示!')
  console.log('如果您想要不同的IP白名单，请修改ALLOWED_IPS环境变量')
}

initAdmin().catch(console.error) 