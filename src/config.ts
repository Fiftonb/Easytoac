export const config = {
  // 数据库配置
  database: {
    url: "file:./dev.db"
  },
  
  // JWT配置
  jwt: {
    secret: "72a99ef4352d55f8c6c5bdbe8a54e0d58df60740e229318cbc2dea4154ef48dd",
    expiresIn: "24h"
  },
  
  // 安全配置
  security: {
    allowedIPs: ["127.0.0.1", "::1"],
    bcryptRounds: 12
  },
  
  // 服务器配置
  server: {
    port: 3000,
    nodeEnv: process.env.NODE_ENV || "development"
  }
} 