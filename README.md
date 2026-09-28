# ⚡ aiThss Bio - Ultra Modern Personal Bio & Portfolio

> Trang liên kết cá nhân (Link-in-Bio) hiện đại, phong cách Glassmorphism, tối ưu cho thiết bị di động (Mobile-First), tích hợp VietQR và trình phát nhạc nền Ambient.

---

## 🌟 Tính Năng Nổi Bật

- **Trải nghiệm Mobile-First**: Hiệu ứng kính mờ (Frosted Glassmorphism), nền động Aurora Glow, micro-interactions xúc giác mượt mà.
- **5 Bộ Theme sang trọng**: Cyber Dark, Emerald Aurora, Obsidian Gold, Sunset Vibe, Midnight Mono.
- **Chuẩn PWA (Progressive Web App)**: Cài đặt trực tiếp lên màn hình chính điện thoại (Add to Home Screen), hỗ trợ offline qua Service Worker.
- **VietQR Napas 24/7 & Mã QR chia sẻ**: Tự động tạo mã QR chuyển khoản và mã QR chia sẻ trang cá nhân offline.
- **Trình phát nhạc nền Chill Ambient**: Dock nghe nhạc Lo-fi thư giãn với thanh sóng Equalizer động.
- **Bảng điều khiển tích hợp**: Quản lý liên kết cá nhân, cập nhật hồ sơ, mạng xã hội và sao lưu dữ liệu.

---

## 🚀 Khởi Chạy Cục Bộ (Local Development)

### Yêu cầu:
- Node.js 18+ hoặc 20+

### Các bước:
```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy máy chủ
npm start
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Triển Khai Lên VPS & Tên Miền

### Cách 1: Docker Compose (Khuyên dùng)
```bash
git clone https://github.com/aithss/bio.git
cd bio
docker compose up -d --build
```
Dịch vụ sẽ tự động chạy tại cổng `3000` và duy trì dữ liệu qua volume mount `data/`.

---

### Cách 2: PM2 (Node.js Process Manager)
```bash
npm install -g pm2
npm install --production
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

### Cấu hình Nginx Reverse Proxy & SSL
Xem file mẫu cấu hình tại [`nginx.conf.example`](nginx.conf.example).

Cấp SSL tự động miễn phí qua Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

### Cập nhật mã nguồn nhanh:
```bash
bash deploy.sh
```

---

## 📁 Cấu Trúc Thư Mục

```
bio/
├── server.js              # Express Server, REST API & Data Storage
├── package.json           # Cấu hình dự án & dependencies
├── Dockerfile             # Container production tối ưu Alpine
├── docker-compose.yml     # Quản lý container & volume persistence
├── ecosystem.config.js    # Cấu hình tiến trình PM2
├── nginx.conf.example     # File mẫu cấu hình Nginx Reverse Proxy & SSL
├── deploy.sh              # Script 1-click update/deploy
├── data/
│   ├── bio-data.json      # Cơ sở dữ liệu JSON lưu trữ hồ sơ, links & stats
│   └── sessions.json      # Lưu trữ phiên đăng nhập quản trị
└── public/                # Frontend Web (HTML, CSS, JS, PWA Manifest)
```

---

## 📄 Bản quyền
- Phát triển bởi **aiThss**.
