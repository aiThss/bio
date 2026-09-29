// Phosphor Icons 2.1.2. Brand marks use the fill weight; interface icons use regular.
const ICONS = {
  telegram: ['telegram-logo', 'fill'],
  github: ['github-logo', 'fill'],
  facebook: ['facebook-logo', 'fill'],
  zalo: ['chat-circle-text', 'fill'],
  tiktok: ['tiktok-logo', 'fill'],
  youtube: ['youtube-logo', 'fill'],
  instagram: ['instagram-logo', 'fill'],
  x: ['x-logo', 'fill'],
  discord: ['discord-logo', 'fill'],
  mail: ['envelope-simple', 'regular'],
  phone: ['phone', 'regular'],
  user: ['user', 'regular'],
  sparkles: ['sparkle', 'fill'],
  palette: ['palette', 'regular'],
  link: ['link', 'regular'],
  'external-link': ['arrow-square-out', 'regular'],
  'arrow-up-right': ['arrow-up-right', 'regular'],
  copy: ['copy', 'regular'],
  check: ['check', 'regular'],
  lock: ['lock-key', 'regular'],
  unlock: ['lock-key-open', 'regular'],
  shield: ['shield-check', 'regular'],
  coffee: ['coffee', 'fill'],
  'qr-code': ['qr-code', 'regular'],
  music: ['music-note', 'fill'],
  play: ['play', 'fill'],
  pause: ['pause', 'fill'],
  'badge-check': ['seal-check', 'fill'],
  'map-pin': ['map-pin', 'regular'],
  clock: ['clock', 'regular'],
  share: ['share-network', 'regular'],
  trash: ['trash', 'regular'],
  edit: ['pencil-simple', 'regular'],
  plus: ['plus', 'regular'],
  'arrow-up': ['arrow-up', 'regular'],
  'arrow-down': ['arrow-down', 'regular'],
  settings: ['gear', 'regular'],
  eye: ['eye', 'regular'],
  'mouse-pointer-click': ['cursor-click', 'regular'],
  download: ['download-simple', 'regular'],
  upload: ['upload-simple', 'regular'],
  refresh: ['arrow-clockwise', 'regular'],
  power: ['power', 'regular'],
  'folder-git-2': ['folder-notch-open', 'regular'],
  code: ['code', 'regular'],
  send: ['paper-plane-tilt', 'fill'],
  globe: ['globe-hemisphere-west', 'regular'],
  image: ['image-square', 'regular'],
  xclose: ['x', 'regular']
};

function getIcon(name, size = 20, className = '') {
  const key = String(name || '').toLowerCase().trim();
  const [glyph, weight] = ICONS[key] || ICONS.link;
  const family = weight === 'fill' ? 'ph-fill' : 'ph';
  return `<i class="${family} ph-${glyph}${className ? ` ${className}` : ''}" style="font-size:${size}px" aria-hidden="true"></i>`;
}

window.ICONS = ICONS;
window.getIcon = getIcon;
