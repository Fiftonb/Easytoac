#!/bin/bash

# 数据库恢复脚本
DB_PATH="prisma/dev.db"
BACKUP_DIR="backups"

echo "可用的备份文件："
echo ""

# 显示可用的备份文件
if [ -d "$BACKUP_DIR" ]; then
    echo "=== 数据库文件备份 ==="
    ls -la $BACKUP_DIR/*.backup_* 2>/dev/null | head -10
    echo ""
    echo "=== SQL备份文件 ==="
    ls -la $BACKUP_DIR/*.sql 2>/dev/null | head -10
    echo ""
    echo "=== 压缩备份文件 ==="
    ls -la $BACKUP_DIR/*.sql.gz 2>/dev/null | head -10
else
    echo "没有找到备份目录 $BACKUP_DIR"
fi

echo ""
echo "恢复选项："
echo "1. 从数据库文件恢复: ./scripts/restore-db.sh file <备份文件路径>"
echo "2. 从SQL文件恢复: ./scripts/restore-db.sh sql <SQL文件路径>"
echo "3. 从压缩文件恢复: ./scripts/restore-db.sh gz <压缩文件路径>"

echo ""
echo "示例："
echo "  ./scripts/restore-db.sh file backups/dev.db.backup_20241206_120000"
echo "  ./scripts/restore-db.sh sql backups/backup_20241206_120000.sql"
echo "  ./scripts/restore-db.sh gz backups/backup_20241206_120000.sql.gz"

if [ $# -eq 2 ]; then
    RESTORE_TYPE=$1
    RESTORE_FILE=$2
    
    if [ ! -f "$RESTORE_FILE" ]; then
        echo "错误：备份文件 $RESTORE_FILE 不存在！"
        exit 1
    fi
    
    # 创建当前数据库的备份
    echo "创建当前数据库的安全备份..."
    cp $DB_PATH ${DB_PATH}.safety_backup_$(date +%Y%m%d_%H%M%S)
    
    case $RESTORE_TYPE in
        "file")
            echo "从数据库文件恢复: $RESTORE_FILE"
            cp "$RESTORE_FILE" "$DB_PATH"
            echo "恢复完成！"
            ;;
        "sql")
            echo "从SQL文件恢复: $RESTORE_FILE"
            rm -f "$DB_PATH"
            sqlite3 "$DB_PATH" < "$RESTORE_FILE"
            echo "恢复完成！"
            ;;
        "gz")
            echo "从压缩文件恢复: $RESTORE_FILE"
            rm -f "$DB_PATH"
            gunzip -c "$RESTORE_FILE" | sqlite3 "$DB_PATH"
            echo "恢复完成！"
            ;;
        *)
            echo "错误：不支持的恢复类型 $RESTORE_TYPE"
            echo "支持的类型：file, sql, gz"
            exit 1
            ;;
    esac
    
    echo "数据库已从 $RESTORE_FILE 恢复"
    echo "当前数据库大小: $(ls -lh $DB_PATH | awk '{print $5}')"
fi 