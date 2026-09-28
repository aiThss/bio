const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Set test port
process.env.PORT = '3099';
const BASE_URL = 'http://localhost:3099';

// Start server
let serverProcess;

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

  before(async () => {
    // Require server
    const mod = require('../server.js');
    serverInstance = mod.server;
    // Wait for server to bind
    await new Promise(r => setTimeout(r, 500));
  });

  after(async () => {
    if (serverInstance) {
      await new Promise(r => serverInstance.close(r));
    }
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
    // Fetch a link id
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
});
