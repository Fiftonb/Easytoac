# 激活码管理系统

这是一个基于Next.js开发的激活码管理系统，提供激活码的生成和验证功能。系统包含管理后台和验证API接口，支持IP白名单访问控制。

## 项目概述

### 技术栈
- 框架：Next.js 14 (App Router)
- 数据库：SQLite3 + Prisma ORM
- 认证：JWT (使用jose库)
- UI：Tailwind CSS
- 运行环境：Node.js >= 18

### 核心功能
1. 管理员登录（单一管理员，固定账号）
2. 激活码生成（支持批量生成，可设置有效期）
3. 激活码验证（支持一码一机，自动失效）

## 代码结构

```
admin/
├── prisma/                    # Prisma配置和数据库模型
│   └── schema.prisma         # 数据库模型定义
├── src/
│   ├── app/                  # Next.js应用代码
│   │   ├── admin/           # 管理后台页面
│   │   │   ├── login/      # 登录页面
│   │   │   └── dashboard/  # 管理面板
│   │   └── api/            # API路由
│   │       ├── admin/      # 管理接口
│   │       └── verify/     # 验证接口
│   └── middleware.ts        # 认证中间件
├── scripts/                  # 工具脚本
│   └── init-admin.ts       # 初始化管理员账号
└── .env                     # 环境变量配置
```

### 关键文件说明

- `src/middleware.ts`: 实现IP白名单和JWT认证的中间件
- `src/app/admin/login/page.tsx`: 管理员登录页面
- `src/app/admin/dashboard/page.tsx`: 激活码生成管理页面
- `src/app/api/admin/login/route.ts`: 管理员登录API
- `src/app/api/admin/codes/generate/route.ts`: 激活码生成API
- `src/app/api/verify/route.ts`: 激活码验证API
- `prisma/schema.prisma`: 数据库模型定义

## 核心功能说明

### 1. 认证机制
- 使用环境变量存储单一管理员账号信息
- 密码以bcrypt加密存储
- 登录成功后使用JWT生成会话token
- token通过httpOnly cookie传递
- IP白名单限制管理后台访问

### 2. 激活码生成
- 使用crypto生成16位随机字符串作为激活码
- 支持批量生成（1-100个）
- 可设置有效期（天数）
- 自动检查并确保激活码唯一性

### 3. 激活码验证
- 验证激活码存在性
- 检查激活码是否过期
- 检查激活码是否已被使用
- 支持同一机器重复验证
- 首次使用时绑定机器ID

## 数据库说明

### ActivationCode表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| code | String | 激活码(唯一) |
| isUsed | Boolean | 是否已使用 |
| usedAt | DateTime? | 使用时间 |
| usedBy | String? | 使用者标识 |
| createdAt | DateTime | 创建时间 |
| expiresAt | DateTime? | 过期时间 |

## API路由说明

### 1. 验证激活码
```
POST /api/verify
Content-Type: application/json

请求体：
{
    "code": "激活码",
    "machine_id": "机器唯一标识"
}

成功响应：
{
    "success": true,
    "message": "激活码验证成功",
    "expires_at": "2024-03-31T00:00:00.000Z"
}

失败响应：
{
    "success": false,
    "message": "错误信息"
}
```

### 2. 管理员登录
```
POST /api/admin/login
Content-Type: application/json

请求体：
{
    "username": "admin",
    "password": "管理员密码"
}
```

### 3. 生成激活码
```
POST /api/admin/codes/generate
Content-Type: application/json

请求体：
{
    "amount": 生成数量,
    "expiryDays": 有效期天数
}
```

## 安全特性

1. 密码安全
   - 使用bcrypt加密存储密码
   - 随机生成密码和JWT密钥

2. 会话安全
   - 使用httpOnly cookie
   - JWT有效期24小时
   - 支持安全登出

3. 访问控制
   - IP白名单限制
   - 路由级别的认证保护
   - API访问频率限制