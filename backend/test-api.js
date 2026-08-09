/**
 * API Testing Script
 * 
 * Run this to test all major API endpoints
 * Usage: node test-api.js
 */

require('dotenv').config();
const http = require('http');

const API_BASE = `http://localhost:${process.env.PORT || 5000}/api`;

let passCount = 0;
let failCount = 0;

// Helper to make HTTP requests
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test helper
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
    failCount++;
  }
}

// Tests
async function runTests() {
  console.log('\n🧪 Testing EternaRest API...\n');

  // Health check
  await test('Health Check', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.status !== 'OK') throw new Error('Server not healthy');
  });

  // Public endpoints
  await test('GET /api/public/services', async () => {
    const res = await request('GET', '/public/services');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  await test('GET /api/public/packages', async () => {
    const res = await request('GET', '/public/packages');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  await test('GET /api/public/testimonials', async () => {
    const res = await request('GET', '/public/testimonials');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  await test('GET /api/public/banners', async () => {
    const res = await request('GET', '/public/banners');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  await test('GET /api/public/settings', async () => {
    const res = await request('GET', '/public/settings');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  await test('POST /api/public/testimonials (submit)', async () => {
    const res = await request('POST', '/public/testimonials', {
      name: 'Test User',
      email: 'test@example.com',
      rating: 5,
      message: 'This is a test testimonial'
    });
    if (res.status !== 201) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Submission failed');
  });

  await test('POST /api/public/contact', async () => {
    const res = await request('POST', '/public/contact', {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message'
    });
    if (res.status !== 201) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Submission failed');
  });

  // Memorials
  await test('GET /api/memorials', async () => {
    const res = await request('GET', '/memorials');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  await test('GET /api/memorials/search', async () => {
    const res = await request('GET', '/memorials/search?q=test');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  });

  // Niches
  await test('GET /api/niches', async () => {
    const res = await request('GET', '/niches');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  });

  // Admin login (should fail without credentials)
  await test('POST /api/admin/login (unauthorized)', async () => {
    const res = await request('POST', '/admin/login', {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });
    if (res.status === 200) throw new Error('Should have failed with wrong credentials');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${passCount + failCount}`);
  console.log('='.repeat(50) + '\n');

  if (failCount > 0) {
    console.log('⚠️  Some tests failed. Check your backend configuration.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! Your API is working correctly.\n');
    process.exit(0);
  }
}

// Run
console.log('Make sure your backend server is running on http://localhost:' + (process.env.PORT || 5000));
console.log('Waiting 2 seconds before starting tests...\n');

setTimeout(runTests, 2000);
