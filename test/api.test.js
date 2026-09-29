const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Set test files to avoid polluting production bio-data.json
const TEST_DATA_FILE = path.join(__dirname, 'test-bio-data.json');
const TEST_SESSIONS_FILE = path.join(__dirname, 'test-sessions.json');
const REAL_DATA_FILE = path.join(__dirname, '..', 'data', 'bio-data.json');

fs.copyFileSync(REAL_DATA_FILE, TEST_DATA_FILE);
fs.writeFileSync(TEST_SESSIONS_FILE, '[]', 'utf-8');

process.env.DATA_FILE = TEST_DATA_FILE;
process.env.SESSIONS_FILE = TEST_SESSIONS_FILE;
process.env.PORT = '3099';
const BASE_URL = 'http://localhost:3099';

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqOpts = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      if (typeof options.body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(options.body));
      } else {
        req.write(options.body);
      }
    }
    req.end();
  });
}

describe('aiThss Bio Backend & API Test Suite', () => {
  let adminToken = '';
  let createdLinkId = '';
  let serverInstance = null;
  let resetRateLimit = null;

  before(async () => {
    const mod = require('../server.js');
    serverInstance = mod.server;
    resetRateLimit = mod.resetRateLimit;
    await new Promise(r => setTimeout(r, 500));
  });

  after(async () => {
    if (serverInstance) {
      await new Promise(r => serverInstance.close(r));
    }
    // Clean up temporary test files
    if (fs.existsSync(TEST_DATA_FILE)) fs.unlinkSync(TEST_DATA_FILE);
    if (fs.existsSync(TEST_SESSIONS_FILE)) fs.unlinkSync(TEST_SESSIONS_FILE);
  });

  test('1. GET /api/bio returns public profile, active links and hides adminPinHash', async () => {
    const res = await request('/api/bio');
    assert.strictEqual(res.status, 200);
    assert.ok(res.json, 'Response should be JSON');
    assert.ok(res.json.profile, 'Profile exists');
    assert.strictEqual(res.json.adminPinHash, undefined, 'adminPinHash must be masked/stripped');
    assert.ok(Array.isArray(res.json.links), 'Links should be an array');
    assert.ok(res.json.stats.totalViews >= 1, 'Views counter should increment');
  });

  test('2. POST /api/click/:id tracks link clicks', async () => {
    const bioRes = await request('/api/bio');
    const firstLink = bioRes.json.links[0];
    assert.ok(firstLink, 'At least one link exists');
    const prevClicks = firstLink.clicks || 0;

    const clickRes = await request(`/api/click/${firstLink.id}`, { method: 'POST' });
    assert.strictEqual(clickRes.status, 200);
    assert.strictEqual(clickRes.json.clicks, prevClicks + 1);

    // Test non-existing link
    const invalidRes = await request('/api/click/invalid-link-999', { method: 'POST' });
    assert.strictEqual(invalidRes.status, 404);
  });

  test('3. POST /api/admin/login rejects wrong PIN and accepts correct PIN', async () => {
    if (resetRateLimit) resetRateLimit();

    // Wrong PIN
    const failRes = await request('/api/admin/login', {
      method: 'POST',
      body: { pin: 'wrong-pin-0000' }
    });
    assert.strictEqual(failRes.status, 401);
    assert.ok(failRes.json.error);

    // Correct Default PIN (admin123)
    const successRes = await request('/api/admin/login', {
      method: 'POST',
      body: { pin: 'admin123' }
    });
    assert.strictEqual(successRes.status, 200);
    assert.strictEqual(successRes.json.success, true);
    assert.ok(successRes.json.token, 'Should return session token');
    adminToken = successRes.json.token;
  });

  test('4. GET /api/admin/verify validates active session token', async () => {
    // Unauthenticated
    const unauthRes = await request('/api/admin/verify');
    assert.strictEqual(unauthRes.status, 401);

    // Authenticated
    const authRes = await request('/api/admin/verify', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(authRes.status, 200);
    assert.strictEqual(authRes.json.valid, true);
  });

  test('5. POST /api/admin/links creates a new link', async () => {
    const newLinkData = {
      title: 'Test Automated Link',
      url: 'https://example.com/test',
      subtitle: 'Testing automated creation',
      category: 'projects',
      badge: 'TEST',
      badgeColor: '#10b981',
      icon: 'sparkles',
      featured: true,
      active: true
    };

    const res = await request('/api/admin/links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: newLinkData
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.json.success, true);
    assert.ok(res.json.link.id);
    assert.strictEqual(res.json.link.title, newLinkData.title);
    createdLinkId = res.json.link.id;
  });

  test('6. PUT /api/admin/links/:id updates an existing link', async () => {
    assert.ok(createdLinkId, 'Created link ID must be set');
    const res = await request(`/api/admin/links/${createdLinkId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Updated Test Link Title',
        badge: 'UPDATED'
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.link.title, 'Updated Test Link Title');
    assert.strictEqual(res.json.link.badge, 'UPDATED');
  });

  test('7. DELETE /api/admin/links/:id removes the link', async () => {
    const res = await request(`/api/admin/links/${createdLinkId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.success, true);

    // Verify deleted
    const verifyDel = await request(`/api/admin/links/${createdLinkId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(verifyDel.status, 404);
  });

  test('8. PUT /api/admin/profile updates profile information', async () => {
    const res = await request('/api/admin/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { location: 'Hà Nội, Việt Nam 🇻🇳' }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.profile.location, 'Hà Nội, Việt Nam 🇻🇳');

    const avatarRes = await request('/api/admin/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { avatar: 'data:image/webp;base64,UklGRg==' }
    });
    assert.strictEqual(avatarRes.status, 200);
    assert.ok(avatarRes.json.profile.avatar.startsWith('data:image/webp;base64,'));

    const invalidAvatarRes = await request('/api/admin/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { avatar: 'javascript:alert(1)' }
    });
    assert.strictEqual(invalidAvatarRes.status, 400);
  });

  test('8b. PUT /api/admin/music accepts YouTube links and rejects invalid hosts', async () => {
    const validRes = await request('/api/admin/music', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { youtubeUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE' }
    });
    assert.strictEqual(validRes.status, 200);
    assert.strictEqual(validRes.json.music.youtubeUrl, 'https://www.youtube.com/watch?v=M7lc1UVf-VE');

    const invalidRes = await request('/api/admin/music', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { youtubeUrl: 'https://example.com/watch?v=M7lc1UVf-VE' }
    });
    assert.strictEqual(invalidRes.status, 400);
  });

  test('9. GET /api/admin/export downloads backup data', async () => {
    const res = await request('/api/admin/export', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.json.profile);
    assert.ok(Array.isArray(res.json.links));
  });

  test('10. SPA Fallback: GET /admin returns HTML index page', async () => {
    const res = await request('/admin');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('<!DOCTYPE html>'));
    assert.ok(res.body.includes('id="adminView"'));
  });

  test('11. Edge Case: Empty PIN submission returns 400', async () => {
    const res = await request('/api/admin/login', {
      method: 'POST',
      body: { pin: '' }
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.json.error);
  });

  test('12. Edge Case: Creating link with missing required fields returns 400', async () => {
    const res = await request('/api/admin/links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: '', url: '' }
    });
    assert.strictEqual(res.status, 400);
  });

  test('13. Edge Case: Reordering links with non-array returns 400', async () => {
    const res = await request('/api/admin/links-reorder', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { linkIds: 'not-an-array' }
    });
    assert.strictEqual(res.status, 400);
  });

  test('14. Edge Case: Changing PIN with wrong current PIN returns 400', async () => {
    const res = await request('/api/admin/change-pin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { currentPin: 'incorrect-pin', newPin: 'newpin999' }
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.json.error);
  });

  test('15. Security: Link creation rejects unsafe URL schemes (javascript:)', async () => {
    const res = await request('/api/admin/links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: 'Malicious Link', url: 'javascript:alert(1)' }
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.json.error.includes('URL không hợp lệ'));

    // Verify valid schemes are allowed
    const validHashRes = await request('/api/admin/links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: 'Donate Anchor', url: '#donate' }
    });
    assert.strictEqual(validHashRes.status, 201);
    await request(`/api/admin/links/${validHashRes.json.link.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });

  test('16. Categories Management: PUT /api/admin/categories updates category list', async () => {
    const newCats = [
      { id: 'all', name: 'Tất cả' },
      { id: 'projects', name: 'Dự án' },
      { id: 'services', name: 'Dịch vụ' },
      { id: 'social', name: 'Xã hội' },
      { id: 'custom', name: 'Góc sáng tạo' }
    ];
    const res = await request('/api/admin/categories', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { categories: newCats }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.categories.length, 5);

    // Non-array rejection
    const failRes = await request('/api/admin/categories', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { categories: 'not-array' }
    });
    assert.strictEqual(failRes.status, 400);
  });

  test('17. Security: Brute-force lockout triggers 429 after 5 failed PIN attempts', async () => {
    if (resetRateLimit) resetRateLimit();

    // Send 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      const fail = await request('/api/admin/login', {
        method: 'POST',
        body: { pin: `wrong-${i}` }
      });
      assert.strictEqual(fail.status, 401);
    }

    // 6th attempt must be locked out with 429
    const lockRes = await request('/api/admin/login', {
      method: 'POST',
      body: { pin: 'admin123' } // Even correct PIN gets rejected when locked
    });
    assert.strictEqual(lockRes.status, 429);
    assert.ok(lockRes.json.error.includes('Quá nhiều lần thử'));

    // Reset rate limit for subsequent clean operations
    if (resetRateLimit) resetRateLimit();
  });
});
