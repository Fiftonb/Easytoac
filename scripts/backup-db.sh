#!/bin/bash

# 数据库备份脚本
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="prisma/dev.db"
BACKUP_DIR="backups"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "开始备份数据库..."

# 方法1：直接复制数据库文件
echo "创建数据库文件备份..."
cp $DB_PATH $BACKUP_DIR/dev.db.backup_$TIMESTAMP

# 方法2：创建SQL转储
echo "创建SQL转储备份..."
sqlite3 $DB_PATH .dump > $BACKUP_DIR/backup_$TIMESTAMP.sql

# 方法3：压缩SQL转储
echo "创建压缩备份..."
sqlite3 $DB_PATH .dump | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

echo "备份完成！"
echo "文件备份: $BACKUP_DIR/dev.db.backup_$TIMESTAMP"
echo "SQL备份: $BACKUP_DIR/backup_$TIMESTAMP.sql"
echo "压缩备份: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# 显示备份文件大小
echo ""
echo "备份文件大小："
ls -lh $BACKUP_DIR/*$TIMESTAMP* 