# ⚡ aiThss Bio - Ultra Modern Personal Bio & Portfolio

> Website cá nhân dạng Link-in-Bio hiện đại, phong cách Cyberpunk Glassmorphism đỉnh cao, tối ưu tuyệt đối cho thiết bị di động (Mobile-First), tích hợp bảng quản trị ẩn bí mật (`/admin`), tùy chọn liên kết cá nhân không giới hạn, VietQR động và trình phát nhạc nền Ambient.

---

## 🌟 Tính Năng Nổi Bật

### 📱 Trải Nghiệm Mobile-First & Giao Diện Cao Cấp
- **Aesthetic**: Hiệu ứng kính mờ Frosted Glassmorphism, nền động Aurora Mesh Glow và Sparkle badges theo phong cách Uiverse.
- **Micro-interactions**: Haptic feedback (rung nhẹ khi chạm trên điện thoại), hiệu ứng nhấp nhả đàn hồi (Tactile press), sao chép link 1-chạm với Toast thông báo.
- **5 Bộ Themes Sang Trọng**:
  - `Cyber Dark` (Mặc định: Đen vũ trụ & Neon Cyan / Violet)
  - `Emerald Aurora` (Xanh ngọc lục bảo ánh sáng cực quang)
  - `Obsidian Gold` (Đen Carbon & Vàng Gold quý phái)
  - `Sunset Vibe` (Hoàng hôn Rose & Cam nhiệt đới)
  - `Midnight Mono` (Trắng Đen Titan tối giản sắc nét)
- **Chuẩn PWA (Progressive Web App)**: Hỗ trợ "Thêm vào màn hình chính" (Add to Home Screen) trên iPhone và Android mượt mà như native app, có Service Worker cache offline.
- **Đồng hồ & Vị trí trực tiếp**: Hiển thị thời gian thực theo múi giờ địa phương (`Hà Nội • HH:MM`).

### 🔒 Cổng Quản Trị Ẩn Bí Mật (`/admin`)
- **Cách truy cập**:
  1. Truy cập trực tiếp qua đường dẫn: `https://yourdomain.com/admin` hoặc `https://yourdomain.com/#admin`
  2. **Easter Egg bí mật**: Chạm nhanh vào **Ảnh đại diện (Avatar) 5 lần** trên trang chủ!
  3. Hoặc nhấn vào link kín `Quản trị viên` ở chân trang (Footer).
- **Mã PIN bảo vệ**:
  - Mã PIN mặc định: `admin123`
  - Người dùng có thể đổi mã PIN mới bất cứ lúc nào trong tab **Bảo mật & Sao lưu**.
  - Bàn phím số cảm ứng mượt mà trên điện thoại + hỗ trợ gõ bàn phím vật lý.
  - Phiên đăng nhập được mã hóa an toàn với Token phiên.

### 🛠️ Bộ Công Cụ Quản Lý Toàn Diện Trong Admin
1. **Quản lý Liên kết (Links CRUD)**:
   - Thêm liên kết mới không giới hạn: Tiêu đề, URL, Danh mục, Mô tả phụ (Subtitle), Icon, Nhãn Badge (`HOT`, `NEW`, `24/7`, `FREE`), Màu nhãn.
   - Bật/Tắt tính năng **Spotlight Card (Thẻ nổi bật với viền ánh sáng chạy quanh)**.
   - Sắp xếp thứ tự hiển thị bằng nút **Lên / Xuống (Up / Down)** thuận tiện trên màn hình cảm ứng.
   - Thống kê lượt click theo thời gian thực cho từng liên kết.
2. **Cài đặt Hồ sơ (Profile)**:
   - Cập nhật Họ tên, Username/Handle, URL Avatar, Tiểu sử (Bio), Vị trí, Trạng thái hoạt động, Bật/Tắt Tích xanh xác minh.
3. **Mạng xã hội (Social Accounts)**:
   - Hỗ trợ đầy đủ: Telegram, GitHub, Facebook, Zalo, TikTok, YouTube, Email...
4. **Ủng hộ & VietQR Động Chuẩn Napas 24/7**:
   - Tự động tạo mã QR ngân hàng VietQR theo thông tin cấu hình (MB, VCB, ACB, Techcombank, VPBank,...) và số MoMo.
5. **Trình phát Nhạc Nền Ambient Chill Lo-fi**:
   - Dock nghe nhạc nổi với thanh sóng Equalizer chuyển động nhịp nhàng, tùy chỉnh bài hát yêu thích.
6. **Bộ đếm Lượt Xem & Click (Analytics)**:
   - Theo dõi tổng số lượt người xem Bio và tổng số lượt click vào các liên kết.
7. **Sao lưu (Backup) & Khôi phục (Restore)**:
   - Xuất file cấu hình JSON chỉ với 1 click để lưu trữ hoặc chuyển sang máy chủ khác mà không lo mất dữ liệu.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local Development)

### Yêu cầu:
- Đã cài đặt **Node.js** (khuyến nghị phiên bản 18+ hoặc 20+).

### Các bước:
```bash
# 1. Di chuyển vào thư mục dự án
cd bio

# 2. Cài đặt các dependencies
npm install

# 3. Khởi chạy máy chủ
npm start
```

Mở trình duyệt truy cập:
- **Trang Bio**: [http://localhost:3000](http://localhost:3000)
- **Trang Quản trị Ẩn**: [http://localhost:3000/admin](http://localhost:3000/admin) (PIN: `admin123`)

---

## 🌐 Hướng Dẫn Triển Khai Lên VPS & Domain

Dự án được đóng gói sẵn để triển khai lên VPS Linux (Ubuntu, Debian, AlmaLinux, v.v.) trong vài phút:

### Cách 1: Triển khai bằng Docker & Docker Compose (Khuyên dùng nhất ⭐)

Docker đảm bảo ứng dụng chạy độc lập, tự khởi động lại khi VPS reboot và dữ liệu (`data/bio-data.json`) được lưu trữ an toàn trong volume mount.

```bash
# 1. Clone repository về VPS
git clone https://github.com/aithss/bio.git
cd bio

# 2. Khởi chạy container ngầm
docker compose up -d --build
```
Dịch vụ sẽ tự động chạy tại cổng `3000`.

---

### Cách 2: Triển khai bằng PM2 (Node.js Process Manager)

```bash
# 1. Cài đặt PM2 (nếu chưa có)
npm install -g pm2

# 2. Cài dependencies và khởi chạy
npm install --production
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

### Cấu hình Nginx Reverse Proxy & SSL (Domain của bạn)

1. Mở file cấu hình Nginx mẫu: xem file [`nginx.conf.example`](file:///d:/memory/bio/nginx.conf.example).
2. Tạo file cấu hình Nginx trên VPS:
```bash
sudo nano /etc/nginx/sites-available/bio.conf
```
Dán cấu hình và thay `yourdomain.com` bằng tên miền thật của bạn:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
3. Kích hoạt và cấp chứng chỉ SSL miễn phí qua Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/bio.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Cấp chứng chỉ HTTPS tự động
sudo certbot --nginx -d yourdomain.com
```

---

### Cập nhật mã nguồn khi có commit mới (1 lệnh duy nhất):
```bash
bash deploy.sh
```

---

## 📁 Cấu Trúc Thư Mục

```
bio/
├── server.js              # Máy chủ Express & REST API, xác thực PIN & SPA fallback
├── package.json           # Cấu hình dự án & dependencies
├── Dockerfile             # Container production tối ưu Alpine
├── docker-compose.yml     # Quản lý container và volume data persistence
├── ecosystem.config.js    # Cấu hình tiến trình PM2 Cluster
├── nginx.conf.example     # File mẫu cấu hình Nginx Reverse Proxy & SSL
├── deploy.sh              # Script 1-click update/deploy trên VPS
├── data/
│   ├── bio-data.json      # Cơ sở dữ liệu JSON lưu trữ toàn bộ hồ sơ, links & stats
│   └── sessions.json      # Lưu trữ phiên đăng nhập quản trị
└── public/                # Frontend Web
    ├── index.html         # Giao diện chính Mobile-First & Hidden Admin Portal
    ├── manifest.json      # Khai báo chuẩn PWA (Progressive Web App)
    ├── sw.js              # Service Worker tối ưu tải trang offline
    ├── css/
    │   ├── style.css      # CSS hiệu ứng kính mờ, gradient aurora, micro-interactions
    │   └── admin.css      # CSS giao diện quản trị, bàn phím số, form quản lý
    └── js/
        ├── icons.js       # Bộ sưu tập Icon SVG siêu nhẹ độc lập
        ├── qr.js          # Bộ sinh mã QR SVG/PNG thuần JavaScript offline
        ├── app.js         # Xử lý tương tác Bio, đổi theme, đếm click, audio chill
        └── admin.js       # Xử lý bảo mật PIN, CRUD links, cập nhật hồ sơ, sao lưu
```

---

## 🔒 Bản quyền & Tác giả
- Phát triển bởi **aiThss**.
- Mã nguồn mở tự do phục vụ mục đích cá nhân và thương mại.
