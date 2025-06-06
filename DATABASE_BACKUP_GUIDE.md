# 数据库备份与恢复指南

## 快速开始

### 备份数据库

```bash
# 方法1：使用npm脚本（推荐）
npm run db:backup          # 完整备份（文件+SQL+压缩）
npm run db:backup-simple   # 简单文件备份
npm run db:backup-sql      # SQL转储备份

# 方法2：直接运行脚本
./scripts/backup-db.sh

# 方法3：手动备份
cp prisma/dev.db prisma/dev.db.backup_$(date +%Y%m%d_%H%M%S)
```

### 恢复数据库

```bash
# 查看可用备份
./scripts/restore-db.sh

# 从备份恢复
./scripts/restore-db.sh file backups/dev.db.backup_20241206_120000
./scripts/restore-db.sh sql backups/backup_20241206_120000.sql
./scripts/restore-db.sh gz backups/backup_20241206_120000.sql.gz
```

## 详细说明

### 备份类型

1. **文件备份** (.backup_*)
   - 直接复制SQLite数据库文件
   - 最快速，文件较大
   - 适合快速备份和恢复

2. **SQL转储** (.sql)
   - 将数据库导出为SQL语句
   - 可读性好，便于查看数据
   - 跨平台兼容性最好

3. **压缩备份** (.sql.gz)
   - SQL转储的压缩版本
   - 文件最小，节省空间
   - 适合长期存储

### 备份文件位置

- 备份目录：`backups/`
- 文件格式：
  - `dev.db.backup_YYYYMMDD_HHMMSS` - 文件备份
  - `backup_YYYYMMDD_HHMMSS.sql` - SQL备份
  - `backup_YYYYMMDD_HHMMSS.sql.gz` - 压缩备份

### 自动化备份

你可以设置定时任务来自动备份：

```bash
# 编辑crontab
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * cd /path/to/your/project && npm run db:backup

# 每周清理30天前的备份
0 3 * * 0 find /path/to/your/project/backups -name "*.backup_*" -mtime +30 -delete
```

### 注意事项

1. **备份前确保数据库不在写入**
   - 最好在应用停止时备份
   - 或者在低流量时段备份

2. **恢复前会自动创建安全备份**
   - 防止恢复过程中数据丢失
   - 安全备份文件：`dev.db.safety_backup_*`

3. **验证备份完整性**
   ```bash
   # 检查SQLite文件是否完整
   sqlite3 prisma/dev.db "PRAGMA integrity_check;"
   ```

4. **备份存储建议**
   - 本地备份：快速恢复
   - 远程备份：防止硬件故障
   - 多版本保留：防止数据损坏

### 故障排除

- **权限问题**：确保脚本有执行权限 `chmod +x scripts/*.sh`
- **磁盘空间**：确保有足够空间存储备份
- **SQLite工具**：确保系统安装了sqlite3命令行工具

### 监控脚本

可以创建监控脚本来检查备份状态：

```bash
# 检查最新备份时间
ls -lt backups/ | head -5

# 检查备份文件大小
du -sh backups/*
``` 