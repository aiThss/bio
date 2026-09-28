#!/usr/bin/env bash
# ==========================================================
# Script triển khai & tự động cập nhật Bio trên Linux VPS
# ==========================================================

set -e

echo "🚀 Bắt đầu quá trình cập nhật aiThss Bio..."

# Kéo mã nguồn mới nhất từ GitHub
echo "📥 Git Pull từ nhánh main..."
git pull origin main

# Kiểm tra nếu chạy bằng Docker Compose
if command -v docker compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "🐳 Rebuilding & restarting Docker container..."
    docker compose down
    docker compose up -d --build
    echo "✅ Triển khai thành công qua Docker tại cổng 3000!"
    exit 0
fi

# Nếu chạy bằng Node.js trực tiếp hoặc PM2
echo "📦 Cài đặt thư viện npm..."
npm install --production

# Restart PM2 nếu có
if command -v pm2 &> /dev/null; then
    echo "⚡ Khởi động lại tiến trình qua PM2..."
    pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
    echo "✅ Hoàn tất reload PM2!"
else
    echo "⚠️ PM2 không được cài đặt. Khởi chạy bằng Node trực tiếp:"
    echo "   nohup node server.js > bio.log 2>&1 &"
fi

echo "🎉 Hoàn thành triển khai!"
