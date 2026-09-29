// ==========================================================
// aiThss Bio - Main Application Logic
// ==========================================================

(function () {
  'use strict';

  // State
  let bioData = null;
  let activeCategory = 'all';
  let audioPlaying = false;
  let youtubeVideoId = '';
  let avatarTapCount = 0;
  let avatarTapTimer = null;

  const THEMES = ['cyber-dark', 'emerald-aurora', 'obsidian-gold', 'sunset-vibe', 'midnight-mono'];

  // DOM Elements
  const el = {
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileHandle: document.getElementById('profileHandle'),
    profileBio: document.getElementById('profileBio'),
    profileStatusText: document.getElementById('profileStatusText'),
    profileStatusDot: document.getElementById('profileStatusDot'),
    profileStatusTextWrap: document.getElementById('profileStatusTextWrap'),
    verifiedBadge: document.getElementById('verifiedBadge'),
    socialRow: document.getElementById('socialRow'),
    categoryTabs: document.getElementById('categoryTabs'),
    linksList: document.getElementById('linksList'),
    liveTimeText: document.getElementById('liveTimeText'),
    currentYear: document.getElementById('currentYear'),

    // Buttons
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconWrap: document.getElementById('themeIconWrap'),
    qrModalBtn: document.getElementById('qrModalBtn'),
    qrIconWrap: document.getElementById('qrIconWrap'),
    shareBioBtn: document.getElementById('shareBioBtn'),
    shareIconWrap: document.getElementById('shareIconWrap'),
    actionQrBtn: document.getElementById('actionQrBtn'),
    actionQrIcon: document.getElementById('actionQrIcon'),
    actionDonateBtn: document.getElementById('actionDonateBtn'),
    actionDonateIcon: document.getElementById('actionDonateIcon'),
    actionContactBtn: document.getElementById('actionContactBtn'),
    actionContactIcon: document.getElementById('actionContactIcon'),

    // Modals
    qrModal: document.getElementById('qrModal'),
    qrSvgContainer: document.getElementById('qrSvgContainer'),
    downloadQrBtn: document.getElementById('downloadQrBtn'),
    dlQrIcon: document.getElementById('dlQrIcon'),
    donateModal: document.getElementById('donateModal'),
    vietqrImg: document.getElementById('vietqrImg'),
    bankNameVal: document.getElementById('bankNameVal'),
    accountNoText: document.getElementById('accountNoText'),
    accountNameVal: document.getElementById('accountNameVal'),
    momoPhoneText: document.getElementById('momoPhoneText'),
    momoRow: document.getElementById('momoRow'),
    copyAccBtn: document.getElementById('copyAccBtn'),
    copyAccIcon: document.getElementById('copyAccIcon'),
    copyMomoBtn: document.getElementById('copyMomoBtn'),
    copyMomoIcon: document.getElementById('copyMomoIcon'),
    contactModal: document.getElementById('contactModal'),
    contactTeleLink: document.getElementById('contactTeleLink'),
    contactTeleIcon: document.getElementById('contactTeleIcon'),
    contactZaloLink: document.getElementById('contactZaloLink'),
    contactZaloIcon: document.getElementById('contactZaloIcon'),
    contactMailLink: document.getElementById('contactMailLink'),
    contactMailIcon: document.getElementById('contactMailIcon'),

    // Audio
    audioDock: document.getElementById('audioDock'),
    audioPlayBtn: document.getElementById('audioPlayBtn'),
    audioPlayIcon: document.getElementById('audioPlayIcon'),
    audioTitle: document.getElementById('audioTitle'),
    audioArtist: document.getElementById('audioArtist'),
    youtubePlayerPanel: document.getElementById('youtubePlayerPanel'),
    youtubePlayerFrame: document.getElementById('youtubePlayerFrame'),
    bgAudio: document.getElementById('bgAudio'),

    // Stealth Admin
    avatarWrapper: document.getElementById('avatarWrapper'),
    adminStealthBtn: document.getElementById('adminStealthBtn'),
    adminLockIcon: document.getElementById('adminLockIcon'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Helper: Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  window.escapeHtml = escapeHtml;

  function getYouTubeVideoId(value) {
    if (!value) return '';
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0] || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
      }
      if (!['youtube.com', 'music.youtube.com', 'm.youtube.com'].includes(host)) return '';
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v') || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts'].includes(parts[0])) {
        const id = parts[1] || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
      }
    } catch (err) {}
    return '';
  }

  function closeYouTubePlayer() {
    el.youtubePlayerPanel.classList.add('hidden');
    el.youtubePlayerFrame.removeAttribute('src');
    el.audioPlayBtn.setAttribute('aria-expanded', 'false');
    el.audioPlayBtn.setAttribute('aria-label', 'Mở trình phát YouTube');
    el.audioPlayIcon.innerHTML = window.getIcon('youtube', 19);
  }

  // 1. Toast Notification Helper
  window.showToast = function (message, icon = 'check') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${window.getIcon(icon, 18)}</span> <span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    if (navigator.vibrate) navigator.vibrate(20);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  // 2. Play subtle UI sound with Web Audio API (Zero external assets!)
  function playClickSound() {
    try {
      if (!bioData || !bioData.profile || bioData.profile.soundEnabled === false) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // 3. Initialize Top Icons
  function initIcons() {
    if (el.themeIconWrap) el.themeIconWrap.innerHTML = window.getIcon('palette', 18);
    if (el.qrIconWrap) el.qrIconWrap.innerHTML = window.getIcon('qr-code', 18);
    if (el.shareIconWrap) el.shareIconWrap.innerHTML = window.getIcon('share', 18);
    if (el.actionQrIcon) el.actionQrIcon.innerHTML = window.getIcon('qr-code', 20);
    if (el.actionDonateIcon) el.actionDonateIcon.innerHTML = window.getIcon('coffee', 20);
    if (el.actionContactIcon) el.actionContactIcon.innerHTML = window.getIcon('send', 20);
    if (el.adminLockIcon) el.adminLockIcon.innerHTML = window.getIcon('lock', 14);
    if (el.verifiedBadge) el.verifiedBadge.innerHTML = window.getIcon('badge-check', 20);
    if (el.dlQrIcon) el.dlQrIcon.innerHTML = window.getIcon('download', 18);
    if (el.copyAccIcon) el.copyAccIcon.innerHTML = window.getIcon('copy', 16);
    if (el.copyMomoIcon) el.copyMomoIcon.innerHTML = window.getIcon('copy', 16);
    if (el.audioPlayIcon) el.audioPlayIcon.innerHTML = window.getIcon('play', 18);

    if (el.contactTeleIcon) el.contactTeleIcon.innerHTML = window.getIcon('telegram', 22);
    if (el.contactZaloIcon) el.contactZaloIcon.innerHTML = window.getIcon('zalo', 22);
    if (el.contactMailIcon) el.contactMailIcon.innerHTML = window.getIcon('mail', 22);

    document.querySelectorAll('.modal-close-icon').forEach(elem => {
      elem.innerHTML = window.getIcon('xclose', 18);
    });
    document.querySelectorAll('.open-ext-icon').forEach(elem => {
      elem.innerHTML = window.getIcon('external-link', 18);
    });
  }

  // 4. Live Local Clock
  function updateLiveClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const location = (bioData && bioData.profile && bioData.profile.location) || 'Hà Nội, VN';
    if (el.liveTimeText) {
      el.liveTimeText.textContent = `${location} • ${hours}:${minutes}`;
    }
  }

  // 5. Apply Theme
  function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('bio_theme', themeName);
  }

  function cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'cyber-dark';
    const nextIdx = (THEMES.indexOf(current) + 1) % THEMES.length;
    const nextTheme = THEMES[nextIdx];
    applyTheme(nextTheme);
    showToast('Đã đổi bảng màu', 'palette');
    playClickSound();
  }

  // 6. Fetch & Render Bio Data
  async function loadBioData() {
    try {
      const res = await fetch('/api/bio');
      if (!res.ok) throw new Error('Failed to fetch bio data');
      bioData = await res.json();
      renderApp(bioData);
    } catch (err) {
      console.error(err);
      // Fallback message if server error
      if (el.linksList) {
        el.linksList.innerHTML = `<div style="text-align: center; padding: 40px 10px; color: var(--danger);">
          Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra lại kết nối.
        </div>`;
      }
    }
  }

  // 7. Render App Components
  function renderApp(data) {
    const { profile, socials, categories, links, donate, music } = data;

    // Theme setup
    const savedTheme = localStorage.getItem('bio_theme') || profile.theme || 'cyber-dark';
    applyTheme(savedTheme);

    // Profile Details
    if (profile.avatar) el.profileAvatar.src = profile.avatar;
    if (profile.name) el.profileName.textContent = profile.name;
    if (profile.handle) el.profileHandle.textContent = profile.handle;
    if (profile.bio) el.profileBio.textContent = profile.bio;

    if (profile.verified) {
      el.verifiedBadge.style.display = 'flex';
    } else {
      el.verifiedBadge.style.display = 'none';
    }

    if (profile.status && profile.status.visible !== false) {
      el.profileStatusTextWrap.style.display = 'inline-flex';
      el.profileStatusText.textContent = profile.status.text || 'Sẵn sàng nhận dự án';
      if (profile.status.dotColor) {
        el.profileStatusDot.style.background = profile.status.dotColor;
        el.profileStatusDot.style.boxShadow = `0 0 10px ${profile.status.dotColor}`;
      }
    } else {
      el.profileStatusTextWrap.style.display = 'none';
    }

    // Socials
    renderSocials(socials || []);

    // Donate / VietQR data
    if (donate && donate.enabled !== false) {
      el.bankNameVal.textContent = donate.bankId || 'MB Bank';
      el.accountNoText.textContent = donate.accountNo || '';
      el.accountNameVal.textContent = donate.accountName || '';
      if (donate.momoPhone) {
        el.momoRow.style.display = 'flex';
        el.momoPhoneText.textContent = donate.momoPhone;
      } else {
        el.momoRow.style.display = 'none';
      }

      // Generate VietQR URL
      const bankId = encodeURIComponent(donate.bankId || 'MB');
      const accountNo = encodeURIComponent(donate.accountNo || '');
      const accountName = encodeURIComponent(donate.accountName || '');
      const memo = encodeURIComponent('Ung ho aiThss');
      el.vietqrImg.src = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=0&addInfo=${memo}&accountName=${accountName}`;
    }

    // Contact modal links
    const tele = (socials || []).find(s => s.id === 'telegram' && s.active);
    if (tele) el.contactTeleLink.href = tele.url;
    const zalo = (socials || []).find(s => s.id === 'zalo' && s.active);
    if (zalo) el.contactZaloLink.href = zalo.url;
    const mail = (socials || []).find(s => s.id === 'email' && s.active);
    if (mail) el.contactMailLink.href = mail.url;

    // Categories
    renderCategories(categories || []);

    // Links
    renderLinks(links || []);

    // Ambient Music Player
    youtubeVideoId = getYouTubeVideoId(music && music.youtubeUrl);
    const hasAudioFile = Boolean(music && /^https?:\/\//i.test(music.audioUrl || ''));

    if (music && music.enabled && (youtubeVideoId || hasAudioFile)) {
      el.audioDock.classList.remove('hidden');
      el.audioTitle.textContent = music.title || 'Lofi Chill Beats';
      el.audioArtist.textContent = music.artist || 'Relaxing Flow';
      el.bgAudio.pause();
      el.bgAudio.removeAttribute('src');
      closeYouTubePlayer();

      if (youtubeVideoId) {
        el.audioDock.classList.add('youtube-source');
      } else {
        el.audioDock.classList.remove('youtube-source');
        el.bgAudio.src = music.audioUrl;
        syncAudioState(false);
        el.audioPlayBtn.removeAttribute('aria-expanded');
        el.audioPlayBtn.setAttribute('aria-label', 'Phát / Dừng nhạc');
      }
    } else {
      el.audioDock.classList.add('hidden');
      el.audioDock.classList.remove('youtube-source');
      closeYouTubePlayer();
    }

    updateLiveClock();
  }

  // 8. Render Social Icons
  function renderSocials(socials) {
    el.socialRow.innerHTML = '';
    socials.filter(s => s.active !== false).forEach(item => {
      const a = document.createElement('a');
      a.className = 'social-btn';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = item.name;
      a.setAttribute('aria-label', item.name);
      a.innerHTML = window.getIcon(item.icon || item.id, 20);
      a.addEventListener('click', () => playClickSound());
      el.socialRow.appendChild(a);
    });
  }

  // 9. Render Categories
  function renderCategories(categories) {
    el.categoryTabs.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-pill ${cat.id === activeCategory ? 'active' : ''}`;
      btn.type = 'button';
      btn.textContent = cat.name;
      btn.dataset.category = cat.id;
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playClickSound();
        renderLinks(bioData.links || []);
      });
      el.categoryTabs.appendChild(btn);
    });
  }

  // 10. Render Links
  function renderLinks(links) {
    el.linksList.innerHTML = '';

    const filtered = links.filter(l => {
      if (l.active === false) return false;
      if (activeCategory === 'all') return true;
      if (activeCategory === 'featured') return l.featured;
      return l.category === activeCategory;
    });

    if (filtered.length === 0) {
      el.linksList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 14px;">
        Chưa có liên kết nào trong danh mục này.
      </div>`;
      return;
    }

    filtered.forEach(link => {
      const card = document.createElement('div');
      card.className = `link-card ${link.featured ? 'featured' : ''}`;
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');

      const iconSvg = window.getIcon(link.icon || 'link', 22);

      let badgeHtml = '';
      if (link.badge) {
        const badgeColor = link.badgeColor || 'var(--accent-primary)';
        badgeHtml = `<span class="link-badge" style="background: ${badgeColor};">${escapeHtml(link.badge)}</span>`;
      }

      const cleanTitle = escapeHtml(link.title);
      const cleanSubtitle = link.subtitle ? `<span class="link-subtitle">${escapeHtml(link.subtitle)}</span>` : '';

      card.innerHTML = `
        <div class="link-icon-wrap" style="${link.featured ? 'color: var(--accent-primary);' : ''}">${iconSvg}</div>
        <div class="link-content">
          <div class="link-title-row">
            <span class="link-title">${cleanTitle}</span>
            ${badgeHtml}
          </div>
          ${cleanSubtitle}
        </div>
        <div class="link-actions">
          <button class="link-action-btn copy-btn" title="Sao chép liên kết" aria-label="Sao chép ${cleanTitle}">
            ${window.getIcon('copy', 15)}
          </button>
          <span class="click-counter" title="Số lượt click">${link.clicks || 0}</span>
          <span class="link-action-btn" aria-hidden="true">${window.getIcon('arrow-up-right', 16)}</span>
        </div>
      `;

      // Copy link button
      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(link.url).then(() => {
          showToast('Đã sao chép liên kết!', 'check');
        });
      });

      // Card Click -> Track Click and Open URL
      card.addEventListener('click', (e) => {
        playClickSound();
        if (navigator.vibrate) navigator.vibrate(15);

        // Track click asynchronously
        fetch(`/api/click/${link.id}`, { method: 'POST' }).catch(() => {});
        link.clicks = (link.clicks || 0) + 1;
        const counter = card.querySelector('.click-counter');
        if (counter) counter.textContent = link.clicks;

        const targetUrl = String(link.url || '').trim();

        if (targetUrl.startsWith('#')) {
          // Internal modal triggers like #donate
          if (targetUrl === '#donate') openModal('donateModal');
          if (targetUrl === '#qr') openModal('qrModal');
          if (targetUrl === '#contact') openModal('contactModal');
          return;
        }

        // Prevent javascript: or unsafe schemes
        if (/^javascript:/i.test(targetUrl)) {
          console.warn('Blocked unsafe URL scheme');
          return;
        }

        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });

      el.linksList.appendChild(card);
    });
  }

  // 11. Modal Handlers
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      playClickSound();
      if (modalId === 'qrModal') generateBioQR();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // Close modals on backdrop or close button
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.closeModal);
    });
  });

  // 12. QR Code Generation & Download
  function generateBioQR() {
    const url = window.location.href.split('#')[0];
    const svg = window.BioQR.generateSVG(url, { size: 220, darkColor: '#090a0f', lightColor: '#ffffff' });
    el.qrSvgContainer.innerHTML = svg;
  }

  el.downloadQrBtn.addEventListener('click', () => {
    const svgElem = el.qrSvgContainer.querySelector('svg');
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 600, 600);
      const pngUrl = canvas.toDataURL('image/png');
      const dlLink = document.createElement('a');
      dlLink.download = 'aithss-bio-qr.png';
      dlLink.href = pngUrl;
      dlLink.click();
      showToast('Đã tải mã QR!', 'download');
    };
  });

  // Copy Account Number & Momo
  el.copyAccBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(el.accountNoText.textContent.trim()).then(() => {
      showToast('Đã sao chép số tài khoản!', 'check');
    });
  });

  if (el.copyMomoBtn) {
    el.copyMomoBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(el.momoPhoneText.textContent.trim()).then(() => {
        showToast('Đã sao chép số MoMo!', 'check');
      });
    });
  }

  // 13. Share Bio Button (Web Share API with fallback)
  el.shareBioBtn.addEventListener('click', () => {
    const title = (bioData && bioData.profile && bioData.profile.name) ? `${bioData.profile.name} - Bio` : 'aiThss Bio';
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Đã sao chép link Bio vào clipboard!', 'check');
      });
    }
  });

  // Action Grid Click Listeners
  el.actionQrBtn.addEventListener('click', () => openModal('qrModal'));
  el.actionDonateBtn.addEventListener('click', () => openModal('donateModal'));
  el.actionContactBtn.addEventListener('click', () => openModal('contactModal'));
  el.qrModalBtn.addEventListener('click', () => openModal('qrModal'));
  el.themeToggleBtn.addEventListener('click', cycleTheme);

  // 14. Audio Player Controller
  el.bgAudio.loop = true;

  function syncAudioState(isPlaying) {
    audioPlaying = isPlaying;
    if (youtubeVideoId) {
      el.audioDock.classList.remove('playing');
      return;
    }
    if (isPlaying) {
      el.audioDock.classList.add('playing');
      el.audioPlayIcon.innerHTML = window.getIcon('pause', 18);
    } else {
      el.audioDock.classList.remove('playing');
      el.audioPlayIcon.innerHTML = window.getIcon('play', 18);
    }
  }

  el.bgAudio.addEventListener('ended', () => syncAudioState(false));
  el.bgAudio.addEventListener('pause', () => syncAudioState(false));
  el.bgAudio.addEventListener('playing', () => syncAudioState(true));
  el.bgAudio.addEventListener('error', () => {
    syncAudioState(false);
    showToast('Lỗi phát audio', 'xclose');
  });

  el.audioPlayBtn.addEventListener('click', () => {
    if (youtubeVideoId) {
      const shouldOpen = el.youtubePlayerPanel.classList.contains('hidden');
      if (shouldOpen) {
        el.youtubePlayerFrame.src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?playsinline=1&rel=0`;
        el.youtubePlayerPanel.classList.remove('hidden');
        el.audioPlayBtn.setAttribute('aria-expanded', 'true');
        el.audioPlayBtn.setAttribute('aria-label', 'Đóng trình phát YouTube');
        el.audioPlayIcon.innerHTML = window.getIcon('xclose', 18);
      } else {
        closeYouTubePlayer();
      }
      return;
    }

    if (!audioPlaying) {
      el.bgAudio.play().then(() => {
        syncAudioState(true);
        showToast('Đang phát nhạc nền', 'music');
      }).catch(() => {
        syncAudioState(false);
        showToast('Không thể phát nhạc tự động', 'xclose');
      });
    } else {
      el.bgAudio.pause();
      syncAudioState(false);
    }
  });

  // 15. Easter Egg: Tap Avatar 5 Times to trigger Hidden Admin!
  el.avatarWrapper.addEventListener('click', () => {
    avatarTapCount++;
    clearTimeout(avatarTapTimer);
    avatarTapTimer = setTimeout(() => {
      avatarTapCount = 0;
    }, 2500);

    if (avatarTapCount >= 5) {
      avatarTapCount = 0;
      showToast('Đang mở khu vực quản trị', 'unlock');
      if (window.openAdminView) window.openAdminView();
    }
  });

  // Stealth Link in Footer (if present)
  if (el.adminStealthBtn) {
    el.adminStealthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.openAdminView) window.openAdminView();
    });
  }

  // Set Year in footer
  if (el.currentYear) el.currentYear.textContent = new Date().getFullYear();

  // Run initializations
  initIcons();
  loadBioData();
  setInterval(updateLiveClock, 30000);

  // Expose reload for admin updates
  window.reloadBioApp = loadBioData;

})();
