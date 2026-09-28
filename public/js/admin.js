// ==========================================================
// aiThss Bio - Admin Dashboard Controller
// Hidden Route (/admin or #admin) & Secret PIN Auth
// ==========================================================

(function () {
  'use strict';

  let adminToken = localStorage.getItem('bio_admin_token') || null;
  let adminData = null;

  // DOM Elements
  const el = {
    adminView: document.getElementById('adminView'),
    pinScreen: document.getElementById('pinScreen'),
    adminDashboard: document.getElementById('adminDashboard'),
    adminPinInput: document.getElementById('adminPinInput'),
    pinForm: document.getElementById('pinForm'),
    pinSubmitBtn: document.getElementById('pinSubmitBtn'),
    exitAdminBtn: document.getElementById('exitAdminBtn'),
    adminBackToBioBtn: document.getElementById('adminBackToBioBtn'),
    adminLogoutBtn: document.getElementById('adminLogoutBtn'),
    shieldIconWrap: document.getElementById('shieldIconWrap'),

    // Stats
    statViewsVal: document.getElementById('statViewsVal'),
    statClicksVal: document.getElementById('statClicksVal'),
    statViewsIcon: document.getElementById('statViewsIcon'),
    statClicksIcon: document.getElementById('statClicksIcon'),

    // Tabs
    adminTabsNav: document.getElementById('adminTabsNav'),
    tabPanels: document.querySelectorAll('.tab-panel'),

    // Links Tab
    openAddLinkModalBtn: document.getElementById('openAddLinkModalBtn'),
    adminLinksList: document.getElementById('adminLinksList'),
    addLinkIcon: document.getElementById('addLinkIcon'),

    // Modals
    linkModalOverlay: document.getElementById('linkModalOverlay'),
    linkModalTitle: document.getElementById('linkModalTitle'),
    closeLinkModalBtn: document.getElementById('closeLinkModalBtn'),
    cancelLinkBtn: document.getElementById('cancelLinkBtn'),
    linkForm: document.getElementById('linkForm'),
    editLinkId: document.getElementById('editLinkId'),
    inpLinkTitle: document.getElementById('inpLinkTitle'),
    inpLinkUrl: document.getElementById('inpLinkUrl'),
    inpLinkSubtitle: document.getElementById('inpLinkSubtitle'),
    selLinkCategory: document.getElementById('selLinkCategory'),
    selLinkIcon: document.getElementById('selLinkIcon'),
    inpLinkBadge: document.getElementById('inpLinkBadge'),
    inpLinkBadgeColor: document.getElementById('inpLinkBadgeColor'),
    chkLinkFeatured: document.getElementById('chkLinkFeatured'),
    chkLinkActive: document.getElementById('chkLinkActive'),

    // Profile Tab
    adminProfileForm: document.getElementById('adminProfileForm'),
    inpProfileName: document.getElementById('inpProfileName'),
    inpProfileHandle: document.getElementById('inpProfileHandle'),
    inpProfileAvatar: document.getElementById('inpProfileAvatar'),
    inpProfileBio: document.getElementById('inpProfileBio'),
    inpProfileLocation: document.getElementById('inpProfileLocation'),
    inpProfileStatusText: document.getElementById('inpProfileStatusText'),
    chkProfileVerified: document.getElementById('chkProfileVerified'),
    chkStatusVisible: document.getElementById('chkStatusVisible'),

    // Socials Tab
    adminSocialsForm: document.getElementById('adminSocialsForm'),
    adminSocialsInputs: document.getElementById('adminSocialsInputs'),

    // Donate Tab
    adminDonateForm: document.getElementById('adminDonateForm'),
    chkDonateEnabled: document.getElementById('chkDonateEnabled'),
    selBankId: document.getElementById('selBankId'),
    inpAccountNo: document.getElementById('inpAccountNo'),
    inpAccountName: document.getElementById('inpAccountName'),
    inpMomoPhone: document.getElementById('inpMomoPhone'),

    // Theme Tab
    adminThemeForm: document.getElementById('adminThemeForm'),
    selDefaultTheme: document.getElementById('selDefaultTheme'),
    chkMusicEnabled: document.getElementById('chkMusicEnabled'),
    inpMusicTitle: document.getElementById('inpMusicTitle'),
    inpMusicArtist: document.getElementById('inpMusicArtist'),
    inpMusicAudioUrl: document.getElementById('inpMusicAudioUrl'),

    // Security Tab
    adminChangePinForm: document.getElementById('adminChangePinForm'),
    inpCurrentPin: document.getElementById('inpCurrentPin'),
    inpNewPin: document.getElementById('inpNewPin'),
    inpConfirmPin: document.getElementById('inpConfirmPin'),
    btnResetClicks: document.getElementById('btnResetClicks'),
    btnImportDataModal: document.getElementById('btnImportDataModal'),
    exportIcon: document.getElementById('exportIcon'),
    importIcon: document.getElementById('importIcon')
  };

  // Helper for authorized API calls
  async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(endpoint, opts);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Yêu cầu không thành công');
    }
    return data;
  }

  // 1. Initialize Admin Icons
  function initAdminIcons() {
    if (el.shieldIconWrap) el.shieldIconWrap.innerHTML = window.getIcon('shield', 32);
    if (el.statViewsIcon) el.statViewsIcon.innerHTML = window.getIcon('eye', 14);
    if (el.statClicksIcon) el.statClicksIcon.innerHTML = window.getIcon('mouse-pointer-click', 14);
    if (el.addLinkIcon) el.addLinkIcon.innerHTML = window.getIcon('plus', 16);
    if (el.exportIcon) el.exportIcon.innerHTML = window.getIcon('download', 16);
    if (el.importIcon) el.importIcon.innerHTML = window.getIcon('upload', 16);

    document.querySelectorAll('.tab-icon-links').forEach(e => e.innerHTML = window.getIcon('link', 16));
    document.querySelectorAll('.tab-icon-profile').forEach(e => e.innerHTML = window.getIcon('sparkles', 16));
    document.querySelectorAll('.tab-icon-socials').forEach(e => e.innerHTML = window.getIcon('globe', 16));
    document.querySelectorAll('.tab-icon-donate').forEach(e => e.innerHTML = window.getIcon('coffee', 16));
    document.querySelectorAll('.tab-icon-theme').forEach(e => e.innerHTML = window.getIcon('music', 16));
    document.querySelectorAll('.tab-icon-security').forEach(e => e.innerHTML = window.getIcon('lock', 16));
  }

  const escapeHtml = window.escapeHtml || function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  function isValidUrl(s) {
    if (!s) return false;
    const t = String(s).trim();
    if (t.startsWith('#')) return true;
    if (t.startsWith('mailto:') || t.startsWith('tel:')) return true;
    if (/^https?:\/\//i.test(t)) return true;
    return false;
  }

  // 2. Open / Close Admin View
  window.openAdminView = async function (skipPush = false) {
    el.adminView.classList.add('active');
    if (!skipPush && window.location.pathname !== '/admin') {
      try { history.pushState({ view: 'admin' }, '', '/admin'); } catch (e) {}
    }

    if (adminToken) {
      try {
        await apiCall('/api/admin/verify');
        showDashboard();
        return;
      } catch (e) {
        adminToken = null;
        localStorage.removeItem('bio_admin_token');
      }
    }
    showPinScreen();
  };

  function closeAdminView(skipPush = false) {
    el.adminView.classList.remove('active');
    if (!skipPush && window.location.pathname === '/admin') {
      try { history.pushState({ view: 'bio' }, '', '/'); } catch (e) {}
    }
    if (window.reloadBioApp) window.reloadBioApp();
  }

  function showPinScreen() {
    el.pinScreen.style.display = 'flex';
    el.adminDashboard.classList.remove('active');
    el.adminPinInput.value = '';
    setTimeout(() => el.adminPinInput.focus(), 150);
  }

  async function showDashboard() {
    el.pinScreen.style.display = 'none';
    el.adminDashboard.classList.add('active');
    await loadAdminDashboardData();
  }

  // 3. Numeric Keypad Support
  document.querySelectorAll('.pin-key').forEach(key => {
    key.addEventListener('click', () => {
      const val = key.dataset.key;
      const act = key.dataset.action;
      if (val !== undefined) {
        if (el.adminPinInput.value.length < 8) {
          el.adminPinInput.value += val;
        }
      } else if (act === 'clear') {
        el.adminPinInput.value = '';
      } else if (act === 'backspace') {
        el.adminPinInput.value = el.adminPinInput.value.slice(0, -1);
      }
    });
  });

  // 4. PIN Submit Handler
  async function submitPin() {
    const pin = el.adminPinInput.value.trim();
    if (!pin) {
      window.showToast('Vui lòng nhập mã PIN', 'xclose');
      return;
    }

    try {
      const res = await apiCall('/api/admin/login', 'POST', { pin });
      adminToken = res.token;
      localStorage.setItem('bio_admin_token', adminToken);
      window.showToast('Đăng nhập Quản trị thành công! 🚀', 'check');
      showDashboard();
    } catch (err) {
      el.adminPinInput.classList.add('shake');
      setTimeout(() => el.adminPinInput.classList.remove('shake'), 500);
      el.adminPinInput.value = '';
      window.showToast(err.message, 'xclose');
    }
  }

  el.pinSubmitBtn.addEventListener('click', submitPin);
  el.pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPin();
  });

  el.exitAdminBtn.addEventListener('click', closeAdminView);
  el.adminBackToBioBtn.addEventListener('click', closeAdminView);

  // 5. Logout
  el.adminLogoutBtn.addEventListener('click', async () => {
    try {
      await apiCall('/api/admin/logout', 'POST');
    } catch (e) {}
    adminToken = null;
    localStorage.removeItem('bio_admin_token');
    window.showToast('Đã đăng xuất quản trị', 'check');
    closeAdminView();
  });

  // 6. Tabs Controller
  el.adminTabsNav.querySelectorAll('.admin-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const targetId = tabBtn.dataset.tab;
      el.adminTabsNav.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');

      el.tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === targetId);
      });
    });
  });

  // 7. Load Admin Data
  async function loadAdminDashboardData() {
    try {
      adminData = await apiCall('/api/admin/data');
      renderAdminDashboard();
    } catch (err) {
      window.showToast('Lỗi tải dữ liệu admin: ' + err.message, 'xclose');
    }
  }

  function renderAdminDashboard() {
    if (!adminData) return;

    // Render Stats
    const totalViews = (adminData.stats && adminData.stats.totalViews) || 0;
    const totalClicks = (adminData.links || []).reduce((acc, l) => acc + (l.clicks || 0), 0);
    el.statViewsVal.textContent = totalViews.toLocaleString('vi-VN');
    el.statClicksVal.textContent = totalClicks.toLocaleString('vi-VN');

    // Render Tab 1: Links
    renderAdminLinks(adminData.links || []);

    // Render Tab 2: Profile Form
    const prof = adminData.profile || {};
    el.inpProfileName.value = prof.name || '';
    el.inpProfileHandle.value = prof.handle || '';
    el.inpProfileAvatar.value = prof.avatar || '';
    el.inpProfileBio.value = prof.bio || '';
    el.inpProfileLocation.value = prof.location || '';
    el.inpProfileStatusText.value = (prof.status && prof.status.text) || '';
    el.chkProfileVerified.checked = Boolean(prof.verified);
    el.chkStatusVisible.checked = prof.status ? prof.status.visible !== false : true;

    // Render Tab 3: Socials Form
    renderAdminSocials(adminData.socials || []);

    // Render Tab 4: Donate Form
    const don = adminData.donate || {};
    el.chkDonateEnabled.checked = don.enabled !== false;
    el.selBankId.value = don.bankId || 'MB';
    el.inpAccountNo.value = don.accountNo || '';
    el.inpAccountName.value = don.accountName || '';
    el.inpMomoPhone.value = don.momoPhone || '';

    // Render Tab 5: Theme & Music Form
    el.selDefaultTheme.value = prof.theme || 'cyber-dark';
    const mus = adminData.music || {};
    el.chkMusicEnabled.checked = Boolean(mus.enabled);
    el.inpMusicTitle.value = mus.title || '';
    el.inpMusicArtist.value = mus.artist || '';
    el.inpMusicAudioUrl.value = mus.audioUrl || '';
  }

  // 8. Render Admin Links List
  function renderAdminLinks(links) {
    el.adminLinksList.innerHTML = '';

    if (links.length === 0) {
      el.adminLinksList.innerHTML = `<div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 13.5px;">
        Chưa có liên kết nào. Hãy nhấn "Thêm liên kết mới" để bắt đầu!
      </div>`;
      return;
    }

    links.forEach((link, idx) => {
      const row = document.createElement('div');
      row.className = 'admin-link-item';
      row.dataset.id = link.id;

      const isFirst = idx === 0;
      const isLast = idx === links.length - 1;

      const cleanTitle = escapeHtml(link.title);
      const cleanUrl = escapeHtml(link.url);
      const cleanBadge = escapeHtml(link.badge || '');
      const cleanBadgeColor = escapeHtml(link.badgeColor || '#f43f5e');

      row.innerHTML = `
        <div class="reorder-btns">
          <button class="reorder-btn move-up" ${isFirst ? 'disabled style="opacity:0.2;"' : ''} title="Di chuyển lên" aria-label="Di chuyển lên">
            ${window.getIcon('arrow-up', 14)}
          </button>
          <button class="reorder-btn move-down" ${isLast ? 'disabled style="opacity:0.2;"' : ''} title="Di chuyển xuống" aria-label="Di chuyển xuống">
            ${window.getIcon('arrow-down', 14)}
          </button>
        </div>

        <div class="link-icon-wrap" style="width: 38px; height: 38px; min-width: 38px; border-radius: 10px;">
          ${window.getIcon(link.icon || 'link', 18)}
        </div>

        <div class="admin-link-info">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="admin-link-title">${cleanTitle}</span>
            ${cleanBadge ? `<span class="link-badge" style="background:${cleanBadgeColor}; font-size: 9px; padding: 1px 5px;">${cleanBadge}</span>` : ''}
            ${link.featured ? `<span style="color: #fbbf24; display:flex;">${window.getIcon('sparkles', 12)}</span>` : ''}
          </div>
          <span class="admin-link-sub">${cleanUrl} • <strong>${Number(link.clicks) || 0} clicks</strong></span>
        </div>

        <div class="admin-item-actions">
          <label style="cursor: pointer; display: flex; align-items: center;" title="Bật/Tắt hiển thị">
            <input type="checkbox" class="toggle-link-active" ${link.active !== false ? 'checked' : ''} style="display:none;">
            <span class="switch-control" style="width: 34px; height: 18px;"></span>
          </label>
          <button class="btn-icon edit-link-btn" title="Chỉnh sửa" aria-label="Chỉnh sửa">${window.getIcon('edit', 15)}</button>
          <button class="btn-icon delete delete-link-btn" title="Xóa" aria-label="Xóa">${window.getIcon('trash', 15)}</button>
        </div>
      `;

      // Active switch inline toggle
      const activeChk = row.querySelector('.toggle-link-active');
      activeChk.addEventListener('change', async () => {
        try {
          await apiCall(`/api/admin/links/${link.id}`, 'PUT', { active: activeChk.checked });
          link.active = activeChk.checked;
          window.showToast(`Đã ${activeChk.checked ? 'hiển thị' : 'ẩn'} liên kết!`, 'check');
        } catch (e) {
          activeChk.checked = !activeChk.checked;
          window.showToast('Lỗi cập nhật trạng thái', 'xclose');
        }
      });

      // Move Up
      const upBtn = row.querySelector('.move-up');
      if (upBtn) {
        upBtn.addEventListener('click', () => moveLink(idx, idx - 1));
      }

      // Move Down
      const downBtn = row.querySelector('.move-down');
      if (downBtn) {
        downBtn.addEventListener('click', () => moveLink(idx, idx + 1));
      }

      // Edit Button
      const editBtn = row.querySelector('.edit-link-btn');
      editBtn.addEventListener('click', () => openEditLinkModal(link));

      // Delete Button
      const delBtn = row.querySelector('.delete-link-btn');
      delBtn.addEventListener('click', () => deleteLink(link.id, link.title));

      el.adminLinksList.appendChild(row);
    });
  }

  // 9. Move Link Up/Down
  async function moveLink(fromIdx, toIdx) {
    if (!adminData || !adminData.links) return;
    const links = [...adminData.links];
    if (toIdx < 0 || toIdx >= links.length) return;

    const [moved] = links.splice(fromIdx, 1);
    links.splice(toIdx, 0, moved);

    const linkIds = links.map(l => l.id);
    try {
      await apiCall('/api/admin/links-reorder', 'PUT', { linkIds });
      adminData.links = links;
      renderAdminLinks(adminData.links);
      window.showToast('Đã sắp xếp lại liên kết', 'check');
    } catch (err) {
      window.showToast('Lỗi sắp xếp: ' + err.message, 'xclose');
    }
  }

  // 10. Delete Link
  async function deleteLink(id, title) {
    if (!confirm(`Bạn có chắc chắn muốn xóa liên kết "${title}"?`)) return;

    try {
      await apiCall(`/api/admin/links/${id}`, 'DELETE');
      adminData.links = adminData.links.filter(l => l.id !== id);
      renderAdminLinks(adminData.links);
      window.showToast('Đã xóa liên kết thành công!', 'trash');
    } catch (err) {
      window.showToast('Lỗi xóa: ' + err.message, 'xclose');
    }
  }

  // Helper to dynamically populate category options in link modal
  function updateCategorySelectOptions() {
    if (!el.selLinkCategory || !adminData) return;
    const cats = adminData.categories || [
      { id: 'all', name: 'Tất cả' },
      { id: 'projects', name: 'Dự án' },
      { id: 'services', name: 'Liên hệ & Dịch vụ' },
      { id: 'social', name: 'Mạng xã hội' }
    ];
    const prev = el.selLinkCategory.value;
    el.selLinkCategory.innerHTML = '';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.id})`;
      el.selLinkCategory.appendChild(opt);
    });
    if (prev) el.selLinkCategory.value = prev;
  }

  // 11. Modal Add/Edit Link
  function openAddLinkModal() {
    updateCategorySelectOptions();
    el.linkModalTitle.textContent = 'Thêm liên kết mới';
    el.editLinkId.value = '';
    el.linkForm.reset();
    el.chkLinkActive.checked = true;
    el.chkLinkFeatured.checked = false;
    el.linkModalOverlay.classList.add('active');
    setTimeout(() => el.inpLinkTitle.focus(), 150);
  }

  function openEditLinkModal(link) {
    updateCategorySelectOptions();
    el.linkModalTitle.textContent = 'Chỉnh sửa liên kết';
    el.editLinkId.value = link.id;
    el.inpLinkTitle.value = link.title;
    el.inpLinkUrl.value = link.url;
    el.inpLinkSubtitle.value = link.subtitle || '';
    el.selLinkCategory.value = link.category || 'all';
    el.selLinkIcon.value = link.icon || 'link';
    el.inpLinkBadge.value = link.badge || '';
    el.inpLinkBadgeColor.value = link.badgeColor || '#f43f5e';
    el.chkLinkFeatured.checked = Boolean(link.featured);
    el.chkLinkActive.checked = link.active !== false;
    el.linkModalOverlay.classList.add('active');
  }

  function closeLinkModal() {
    el.linkModalOverlay.classList.remove('active');
  }

  el.openAddLinkModalBtn.addEventListener('click', openAddLinkModal);
  el.closeLinkModalBtn.addEventListener('click', closeLinkModal);
  el.cancelLinkBtn.addEventListener('click', closeLinkModal);

  el.linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = el.editLinkId.value;
    const rawUrl = el.inpLinkUrl.value.trim();

    if (!isValidUrl(rawUrl)) {
      window.showToast('Vui lòng nhập URL hợp lệ (bắt đầu bằng https://, http://, #donate, mailto:, tel:)', 'xclose');
      return;
    }

    const payload = {
      title: el.inpLinkTitle.value.trim(),
      url: rawUrl,
      subtitle: el.inpLinkSubtitle.value.trim(),
      category: el.selLinkCategory.value,
      icon: el.selLinkIcon.value,
      badge: el.inpLinkBadge.value.trim(),
      badgeColor: el.inpLinkBadgeColor.value,
      featured: el.chkLinkFeatured.checked,
      active: el.chkLinkActive.checked
    };

    try {
      if (id) {
        // Update
        const res = await apiCall(`/api/admin/links/${id}`, 'PUT', payload);
        const idx = adminData.links.findIndex(l => l.id === id);
        if (idx !== -1) adminData.links[idx] = res.link;
        window.showToast('Đã cập nhật liên kết!', 'check');
      } else {
        // Create
        const res = await apiCall('/api/admin/links', 'POST', payload);
        adminData.links.unshift(res.link);
        window.showToast('Đã thêm liên kết mới!', 'plus');
      }
      closeLinkModal();
      renderAdminLinks(adminData.links);
    } catch (err) {
      window.showToast('Lỗi: ' + err.message, 'xclose');
    }
  });

  // 12. Save Profile Settings
  el.adminProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: el.inpProfileName.value.trim(),
      handle: el.inpProfileHandle.value.trim(),
      avatar: el.inpProfileAvatar.value.trim(),
      bio: el.inpProfileBio.value.trim(),
      location: el.inpProfileLocation.value.trim(),
      verified: el.chkProfileVerified.checked,
      status: {
        text: el.inpProfileStatusText.value.trim(),
        visible: el.chkStatusVisible.checked,
        dotColor: '#10b981'
      }
    };

    try {
      await apiCall('/api/admin/profile', 'PUT', payload);
      adminData.profile = { ...adminData.profile, ...payload };
      window.showToast('Đã lưu thông tin hồ sơ!', 'check');
    } catch (err) {
      window.showToast('Lỗi: ' + err.message, 'xclose');
    }
  });

  // 13. Render & Save Socials
  function renderAdminSocials(socials) {
    el.adminSocialsInputs.innerHTML = '';
    const platforms = [
      { id: 'telegram', name: 'Telegram', icon: 'telegram', defaultUrl: 'https://t.me/' },
      { id: 'github', name: 'GitHub', icon: 'github', defaultUrl: 'https://github.com/' },
      { id: 'facebook', name: 'Facebook', icon: 'facebook', defaultUrl: 'https://facebook.com/' },
      { id: 'zalo', name: 'Zalo', icon: 'zalo', defaultUrl: 'https://zalo.me/' },
      { id: 'tiktok', name: 'TikTok', icon: 'tiktok', defaultUrl: 'https://tiktok.com/@' },
      { id: 'youtube', name: 'YouTube', icon: 'youtube', defaultUrl: 'https://youtube.com/@' },
      { id: 'email', name: 'Email', icon: 'mail', defaultUrl: 'mailto:' }
    ];

    platforms.forEach(p => {
      const existing = socials.find(s => s.id === p.id) || { url: '', active: false };
      const row = document.createElement('div');
      row.className = 'form-row';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <div class="form-group" style="flex: 1;">
          <label class="form-label" style="display:flex; align-items:center; gap:6px;">
            ${window.getIcon(p.icon, 16)} ${p.name}
          </label>
          <input class="form-input soc-url-inp" data-soc-id="${p.id}" data-soc-name="${p.name}" data-soc-icon="${p.icon}" type="url" value="${existing.url || ''}" placeholder="${p.defaultUrl}">
        </div>
        <div style="padding-top: 24px;">
          <label class="switch-label" style="padding: 9px 12px;">
            <input type="checkbox" class="soc-active-chk" data-soc-id="${p.id}" ${existing.active ? 'checked' : ''} style="display:none;">
            <span class="switch-control"></span>
          </label>
        </div>
      `;
      el.adminSocialsInputs.appendChild(row);
    });
  }

  el.adminSocialsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const socials = [];
    document.querySelectorAll('.soc-url-inp').forEach(inp => {
      const id = inp.dataset.socId;
      const name = inp.dataset.socName;
      const icon = inp.dataset.socIcon;
      const url = inp.value.trim();
      const activeChk = document.querySelector(`.soc-active-chk[data-soc-id="${id}"]`);
      const active = activeChk ? activeChk.checked : false;

      if (url) {
        socials.push({ id, name, icon, url, active });
      }
    });

    try {
      await apiCall('/api/admin/socials', 'PUT', { socials });
      adminData.socials = socials;
      window.showToast('Đã lưu cấu hình mạng xã hội!', 'check');
    } catch (err) {
      window.showToast('Lỗi: ' + err.message, 'xclose');
    }
  });

  // 14. Save Donate / VietQR
  el.adminDonateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      enabled: el.chkDonateEnabled.checked,
      bankId: el.selBankId.value,
      accountNo: el.inpAccountNo.value.trim(),
      accountName: el.inpAccountName.value.trim(),
      momoPhone: el.inpMomoPhone.value.trim()
    };

    try {
      await apiCall('/api/admin/donate', 'PUT', payload);
      adminData.donate = { ...adminData.donate, ...payload };
      window.showToast('Đã lưu cấu hình VietQR / Donate!', 'check');
    } catch (err) {
      window.showToast('Lỗi: ' + err.message, 'xclose');
    }
  });

  // 15. Save Theme & Music
  el.adminThemeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const theme = el.selDefaultTheme.value;
    const music = {
      enabled: el.chkMusicEnabled.checked,
      title: el.inpMusicTitle.value.trim(),
      artist: el.inpMusicArtist.value.trim(),
      audioUrl: el.inpMusicAudioUrl.value.trim()
    };

    try {
      await apiCall('/api/admin/profile', 'PUT', { theme });
      await apiCall('/api/admin/music', 'PUT', music);
      adminData.profile.theme = theme;
      adminData.music = music;
      document.documentElement.setAttribute('data-theme', theme);
      window.showToast('Đã lưu giao diện & nhạc nền!', 'check');
    } catch (err) {
      window.showToast('Lỗi: ' + err.message, 'xclose');
    }
  });

  // 16. Change Admin PIN
  el.adminChangePinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPin = el.inpCurrentPin.value;
    const newPin = el.inpNewPin.value;
    const confirmPin = el.inpConfirmPin.value;

    if (newPin !== confirmPin) {
      window.showToast('Xác nhận mã PIN mới không khớp!', 'xclose');
      return;
    }

    try {
      await apiCall('/api/admin/change-pin', 'POST', { currentPin, newPin });
      el.adminChangePinForm.reset();
      window.showToast('Đổi mã PIN quản trị thành công!', 'check');
    } catch (err) {
      window.showToast(err.message, 'xclose');
    }
  });

  // 17. Reset Clicks & Views
  el.btnResetClicks.addEventListener('click', async () => {
    if (!confirm('Bạn có chắc chắn muốn đặt lại tất cả lượt xem và click về 0?')) return;
    try {
      await apiCall('/api/admin/reset-clicks', 'POST');
      el.statViewsVal.textContent = '0';
      el.statClicksVal.textContent = '0';
      (adminData.links || []).forEach(l => l.clicks = 0);
      renderAdminLinks(adminData.links || []);
      window.showToast('Đã đặt lại số liệu thành công!', 'check');
    } catch (e) {
      window.showToast('Lỗi đặt lại số liệu', 'xclose');
    }
  });

  // 18. Import JSON Data
  el.btnImportDataModal.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          await apiCall('/api/admin/import', 'POST', imported);
          window.showToast('Đã nhập dữ liệu sao lưu thành công!', 'check');
          await loadAdminDashboardData();
        } catch (err) {
          window.showToast('File sao lưu không hợp lệ: ' + err.message, 'xclose');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // Check initial route and handle back/forward navigation
  function checkRoute() {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.openAdminView(true);
    } else {
      if (el.adminView && el.adminView.classList.contains('active')) {
        closeAdminView(true);
      }
    }
  }

  window.addEventListener('hashchange', checkRoute);
  window.addEventListener('popstate', checkRoute);

  initAdminIcons();
  checkRoute();

})();
