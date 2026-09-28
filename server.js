const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'bio-data.json');
const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Memory Store & Atomic Data Management ---
let activeSessions = new Set();

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      if (Array.isArray(data)) activeSessions = new Set(data);
    }
  } catch (err) {
    console.error('Error loading sessions:', err);
  }
}

function saveSessions() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([...activeSessions]), 'utf-8');
  } catch (err) {
    console.error('Error saving sessions:', err);
  }
}

loadSessions();

function getBioData() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error('Database file missing: ' + DATA_FILE);
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveBioData(data) {
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

// Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa xác thực hoặc phiên đăng nhập đã hết hạn' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeSessions.has(token)) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
  next();
}

// --- Public Endpoints ---

// 1. Get Public Bio Data (with view count increment)
app.get('/api/bio', (req, res) => {
  try {
    const data = getBioData();
    // Increment view count
    if (!data.stats) data.stats = { totalViews: 0, lastUpdated: new Date().toISOString() };
    data.stats.totalViews = (data.stats.totalViews || 0) + 1;
    data.stats.lastUpdated = new Date().toISOString();
    saveBioData(data);

    // Strip out sensitive credentials before sending
    const { adminPinHash, ...publicData } = data;
    // Filter active links for public
    publicData.links = (publicData.links || []).filter(l => l.active !== false);

    res.json(publicData);
  } catch (err) {
    console.error('GET /api/bio error:', err);
    res.status(500).json({ error: 'Không thể tải dữ liệu bio' });
  }
});

// 2. Track Link Click
app.post('/api/click/:id', (req, res) => {
  try {
    const linkId = req.params.id;
    const data = getBioData();
    const link = (data.links || []).find(l => l.id === linkId);
    if (!link) {
      return res.status(404).json({ error: 'Link không tồn tại' });
    }
    link.clicks = (link.clicks || 0) + 1;
    saveBioData(data);
    res.json({ success: true, linkId, clicks: link.clicks });
  } catch (err) {
    console.error('POST /api/click error:', err);
    res.status(500).json({ error: 'Lỗi ghi nhận lượt click' });
  }
});

// --- Admin Auth Endpoints ---

// Admin Login with PIN
app.post('/api/admin/login', (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'Vui lòng nhập mã PIN quản trị' });
    }
    const data = getBioData();
    const enteredHash = hashPin(pin);

    if (enteredHash !== data.adminPinHash) {
      return res.status(401).json({ error: 'Mã PIN quản trị không chính xác' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    saveSessions();

    res.json({
      success: true,
      token,
      message: 'Đăng nhập thành công',
      user: { name: data.profile.name, handle: data.profile.handle }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi đăng nhập hệ thống' });
  }
});

// Verify Admin Token
app.get('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({ valid: true });
});

// Admin Logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  activeSessions.delete(token);
  saveSessions();
  res.json({ success: true, message: 'Đã đăng xuất' });
});

// Change Admin PIN
app.post('/api/admin/change-pin', requireAdmin, (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Vui lòng nhập cả PIN hiện tại và PIN mới' });
    }
    if (String(newPin).length < 4) {
      return res.status(400).json({ error: 'Mã PIN mới phải có ít nhất 4 ký tự' });
    }

    const data = getBioData();
    if (hashPin(currentPin) !== data.adminPinHash) {
      return res.status(400).json({ error: 'Mã PIN hiện tại không chính xác' });
    }

    data.adminPinHash = hashPin(newPin);
    saveBioData(data);
    res.json({ success: true, message: 'Đã thay đổi mã PIN quản trị thành công' });
  } catch (err) {
    console.error('Change PIN error:', err);
    res.status(500).json({ error: 'Không thể cập nhật mã PIN' });
  }
});

// --- Admin Management Endpoints ---

// Get All Data (Full unmasked for admin)
app.get('/api/admin/data', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    const { adminPinHash, ...adminData } = data;
    res.json(adminData);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải dữ liệu admin' });
  }
});

// Update Profile
app.put('/api/admin/profile', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    data.profile = { ...data.profile, ...req.body };
    saveBioData(data);
    res.json({ success: true, profile: data.profile });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật hồ sơ' });
  }
});

// Update Social Links
app.put('/api/admin/socials', requireAdmin, (req, res) => {
  try {
    const { socials } = req.body;
    if (!Array.isArray(socials)) {
      return res.status(400).json({ error: 'Dữ liệu socials phải là danh sách' });
    }
    const data = getBioData();
    data.socials = socials;
    saveBioData(data);
    res.json({ success: true, socials: data.socials });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật mạng xã hội' });
  }
});

// Update Donate / VietQR
app.put('/api/admin/donate', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    data.donate = { ...data.donate, ...req.body };
    saveBioData(data);
    res.json({ success: true, donate: data.donate });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật thông tin ủng hộ' });
  }
});

// Update Music Player
app.put('/api/admin/music', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    data.music = { ...data.music, ...req.body };
    saveBioData(data);
    res.json({ success: true, music: data.music });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật nhạc nền' });
  }
});

// --- Links CRUD ---

// 1. Get all links
app.get('/api/admin/links', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    res.json(data.links || []);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải danh sách liên kết' });
  }
});

// 2. Create link
app.post('/api/admin/links', requireAdmin, (req, res) => {
  try {
    const { title, url, subtitle, category, badge, badgeColor, icon, featured, active } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Tiêu đề và đường dẫn URL là bắt buộc' });
    }

    const data = getBioData();
    if (!data.links) data.links = [];

    const newLink = {
      id: 'link-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      url: url.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      category: category || 'all',
      badge: badge ? badge.trim() : '',
      badgeColor: badgeColor || '#f43f5e',
      icon: icon || 'link',
      featured: Boolean(featured),
      active: active !== false,
      clicks: 0,
      createdAt: new Date().toISOString()
    };

    data.links.unshift(newLink);
    saveBioData(data);

    res.status(201).json({ success: true, link: newLink });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo liên kết mới' });
  }
});

// 3. Update link
app.put('/api/admin/links/:id', requireAdmin, (req, res) => {
  try {
    const linkId = req.params.id;
    const data = getBioData();
    const index = (data.links || []).findIndex(l => l.id === linkId);

    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy liên kết' });
    }

    data.links[index] = {
      ...data.links[index],
      ...req.body,
      id: linkId // preserve ID
    };

    saveBioData(data);
    res.json({ success: true, link: data.links[index] });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật liên kết' });
  }
});

// 4. Delete link
app.delete('/api/admin/links/:id', requireAdmin, (req, res) => {
  try {
    const linkId = req.params.id;
    const data = getBioData();
    const initialLen = (data.links || []).length;
    data.links = (data.links || []).filter(l => l.id !== linkId);

    if (data.links.length === initialLen) {
      return res.status(404).json({ error: 'Không tìm thấy liên kết' });
    }

    saveBioData(data);
    res.json({ success: true, message: 'Đã xóa liên kết' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa liên kết' });
  }
});

// 5. Reorder links
app.put('/api/admin/links-reorder', requireAdmin, (req, res) => {
  try {
    const { linkIds } = req.body;
    if (!Array.isArray(linkIds)) {
      return res.status(400).json({ error: 'linkIds phải là mảng id' });
    }

    const data = getBioData();
    const linkMap = new Map((data.links || []).map(l => [l.id, l]));
    const reordered = [];

    for (const id of linkIds) {
      if (linkMap.has(id)) {
        reordered.push(linkMap.get(id));
        linkMap.delete(id);
      }
    }
    // Append any links not in linkIds
    for (const remaining of linkMap.values()) {
      reordered.push(remaining);
    }

    data.links = reordered;
    saveBioData(data);
    res.json({ success: true, links: data.links });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi sắp xếp liên kết' });
  }
});

// 6. Reset clicks counter
app.post('/api/admin/reset-clicks', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    (data.links || []).forEach(l => l.clicks = 0);
    if (data.stats) data.stats.totalViews = 0;
    saveBioData(data);
    res.json({ success: true, message: 'Đã đặt lại bộ đếm lượt xem và click' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đặt lại số liệu thống kê' });
  }
});

// 7. Backup Export & Import
app.get('/api/admin/export', requireAdmin, (req, res) => {
  try {
    const data = getBioData();
    const { adminPinHash, ...exportData } = data;
    res.setHeader('Content-Disposition', 'attachment; filename="bio-backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xuất dữ liệu sao lưu' });
  }
});

app.post('/api/admin/import', requireAdmin, (req, res) => {
  try {
    const importedData = req.body;
    if (!importedData.profile || !Array.isArray(importedData.links)) {
      return res.status(400).json({ error: 'Định dạng dữ liệu không hợp lệ' });
    }
    const currentData = getBioData();
    const updated = {
      ...importedData,
      adminPinHash: currentData.adminPinHash // Preserve existing PIN
    };
    saveBioData(updated);
    res.json({ success: true, message: 'Đã nhập dữ liệu thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi nhập dữ liệu sao lưu' });
  }
});

// SPA Fallback: Any route like /admin or /about serves index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bio server is running at http://localhost:${PORT}`);
  console.log(`🔒 Hidden Admin available at http://localhost:${PORT}/admin (Default PIN: admin123)`);
});

module.exports = { app, server };
