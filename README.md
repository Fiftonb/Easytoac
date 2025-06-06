# 激活码管理系统

这是一个基于Next.js开发的激活码管理系统，提供激活码的生成和验证功能。系统包含管理后台和验证API接口，支持IP白名单访问控制。

## 功能特性

- ✅ 激活码生成（支持批量生成，可设置有效期）
- ✅ 激活码验证（支持一码一机，自动失效，智能过期处理）
- ✅ 激活码管理（列表查看、搜索筛选、删除操作）
- ✅ 过期激活码处理（自动判断过期状态，支持重新绑定）
- ✅ 过期绑定清理（管理员可清理过期激活码的绑定关系）
- ✅ 数据统计面板（总数、已使用、已过期、可用统计）
- ✅ 使用率可视化图表
- ✅ 管理员登录（单一管理员，固定账号）
- ✅ IP白名单访问控制
- ✅ JWT会话管理
- ✅ 现代化UI界面（标签页导航）
- ✅ 导出功能（CSV格式，支持筛选结果导出）
- ✅ 分页显示（激活码列表分页）
- ✅ 密码修改功能（管理员可在后台修改登录密码）
- ✅ 系统配置管理（前台可配置IP白名单、JWT设置等）

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: SQLite3 + Prisma ORM
- **认证**: JWT (使用jose库)
- **UI**: Tailwind CSS
- **运行环境**: Node.js >= 18

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置系统

项目使用 `src/config.ts` 文件进行配置管理，无需创建 `.env` 文件。所有配置都在代码中管理，包括：

- 数据库连接配置
- JWT密钥和过期时间
- 安全配置（IP白名单、密码加密强度）
- 服务器配置

您可以根据需要修改 `src/config.ts` 中的配置项。

### 3. 初始化系统

```bash
# 初始化默认管理员账号
npm run init-default-admin

# 初始化系统配置
npm run init-system-config
```

这会在数据库中创建：
- 默认管理员账号（用户名: admin，密码: 123456）
- 系统配置项（IP白名单、JWT设置等）

### 4. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## 使用指南

### 管理后台

1. 访问 `http://localhost:3000/admin/login`
2. 使用默认账号密码登录：
   - 用户名：`admin`
   - 密码：`123456`
   - **重要：首次登录后请立即修改密码！**
3. 在管理后台中可以：
   - **数据统计**: 查看激活码总体使用情况和可视化图表
   - **生成激活码**: 批量生成激活码，设置有效期
   - **激活码管理**: 查看所有激活码，搜索筛选，删除操作，清理过期绑定
   - **修改密码**: 管理员可以修改登录密码，修改后自动登出重新登录
   - **系统配置**: 管理IP白名单、JWT设置、加密强度等系统参数

## 项目结构

```
├── prisma/                    # Prisma配置和数据库模型
│   └── schema.prisma         # 数据库模型定义
├── scripts/                  # 工具脚本
│   └── init-admin.ts        # 初始化管理员账号
├── src/
│   ├── app/                 # Next.js应用代码
│   │   ├── admin/          # 管理后台页面
│   │   │   ├── login/     # 登录页面
│   │   │   └── dashboard/ # 仪表板（含统计、生成、管理功能）
│   │   ├── api/            # API路由
│   │   │   ├── admin/     # 管理接口
│   │   │   │   ├── codes/ # 激活码相关接口
│   │   │   │   │   ├── generate/ # 生成激活码
│   │   │   │   │   ├── list/     # 获取激活码列表
│   │   │   │   │   ├── stats/    # 获取统计数据
│   │   │   │   │   ├── delete/   # 删除激活码
│   │   │   │   │   └── cleanup/  # 清理过期激活码绑定
│   │   │   │   ├── login/ # 管理员登录
│   │   │   │   ├── logout/ # 管理员登出
│   │   │   │   ├── change-password/ # 修改密码
│   │   │   │   └── system-config/ # 系统配置管理
│   │   │   └── verify/    # 激活码验证接口
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── lib/                # 工具库
│   │   ├── db.ts          # 数据库连接
│   │   └── jwt.ts         # JWT工具
│   └── middleware.ts       # 认证中间件
├── package.json
├── tailwind.config.js      # Tailwind配置
├── tsconfig.json          # TypeScript配置
└── .env                   # 环境变量
```

## 安全特性

1. **密码安全**
   - 使用bcrypt加密存储密码（强度可配置）
   - 数据库存储管理员账号信息

2. **会话安全**
   - 使用httpOnly cookie
   - JWT有效期24小时（可配置）
   - 支持安全登出

3. **访问控制**
   - IP白名单限制（可在config.ts中配置）
   - 路由级别的认证保护

4. **激活码安全**
   - 一机器一码限制
   - 智能过期处理
   - 自动防重复绑定

5. **配置安全**
   - 数据库驱动的配置管理
   - 前台可视化配置界面
   - 实时配置更新和缓存机制

## 部署说明

### 生产环境配置

1. 修改 `src/config.ts`，设置更强的JWT密钥
2. 配置正确的IP白名单
3. 使用生产数据库（修改Prisma schema和config.ts）
4. 启用HTTPS
5. 修改默认管理员密码

### Docker部署

可以使用以下Dockerfile：

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 许可证

MIT License

## 支持

如有问题，请提交Issue或联系开发者。 