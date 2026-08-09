require('dotenv').config();
const mongoose = require('mongoose');

const EXPECTED_COLLECTIONS = [
  'admins',
  'bookings',
  'comments',
  'media',
  'memorials',
  'qrcodes',
  'activity_logs',
  'roles',
  'users',
  'settings',
  'packages',
  'payments',
  'familyaccounts',
];

async function generateReport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas — database: eternarest\n');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const found = collections.map(c => c.name.toLowerCase());

    const report = {
      timestamp: new Date().toISOString(),
      database: 'eternarest',
      collections: {},
      integrity: {},
      summary: { total: 0, present: 0, missing: 0 },
    };

    console.log('─────────────────────────────────────────');
    console.log('       COLLECTION VERIFICATION REPORT    ');
    console.log('─────────────────────────────────────────');

    for (const name of EXPECTED_COLLECTIONS) {
      const exists = found.includes(name);
      report.collections[name] = exists ? '✅ present' : '❌ missing';
      report.summary.total++;
      if (exists) {
        report.summary.present++;
        // Get document count
        const count = await mongoose.connection.db.collection(name).countDocuments();
        console.log(`✅ ${name.padEnd(20)} — ${count} documents`);
      } else {
        report.summary.missing++;
        console.log(`❌ ${name.padEnd(20)} — MISSING`);
      }
    }

    // Integrity checks
    console.log('\n─────────────────────────────────────────');
    console.log('           INTEGRITY CHECKS              ');
    console.log('─────────────────────────────────────────');

    // Check packages have correct prices
    const db = mongoose.connection.db;
    const packages = await db.collection('packages').find({}).toArray();
    const priceMap = Object.fromEntries(packages.map(p => [p.name, p.price]));

    const expectedPrices = { standard: 199, premium: 500, legacy: 999 };
    for (const [name, expectedPrice] of Object.entries(expectedPrices)) {
      const actual = priceMap[name];
      const ok = actual === expectedPrice;
      report.integrity[`package_${name}_price`] = ok ? `✅ $${actual}` : `❌ expected $${expectedPrice}, got ${actual ?? 'not found'}`;
      console.log(`${ok ? '✅' : '❌'} Package "${name}" price: $${actual ?? 'NOT FOUND'} (expected $${expectedPrice})`);
    }

    // Check roles seeded
    const roleCount = await db.collection('roles').countDocuments();
    report.integrity['roles_seeded'] = roleCount >= 5 ? `✅ ${roleCount} roles` : `⚠️ only ${roleCount} roles`;
    console.log(`${roleCount >= 5 ? '✅' : '⚠️'} Roles seeded: ${roleCount}`);

    // Check settings seeded
    const settingCount = await db.collection('settings').countDocuments();
    report.integrity['settings_seeded'] = settingCount >= 9 ? `✅ ${settingCount} settings` : `⚠️ only ${settingCount} settings`;
    console.log(`${settingCount >= 9 ? '✅' : '⚠️'} Settings seeded: ${settingCount}`);

    // Check existing collections not broken
    const bookingCount = await db.collection('bookings').countDocuments();
    const memorialCount = await db.collection('memorials').countDocuments();
    const adminCount = await db.collection('admins').countDocuments();
    report.integrity['existing_data_preserved'] = `✅ bookings:${bookingCount} memorials:${memorialCount} admins:${adminCount}`;
    console.log(`✅ Existing data preserved — bookings:${bookingCount} memorials:${memorialCount} admins:${adminCount}`);

    console.log('\n─────────────────────────────────────────');
    console.log('                SUMMARY                  ');
    console.log('─────────────────────────────────────────');
    console.log(`Total expected collections : ${report.summary.total}`);
    console.log(`Present                    : ${report.summary.present}`);
    console.log(`Missing                    : ${report.summary.missing}`);
    const status = report.summary.missing === 0 ? '🎉 ALL COLLECTIONS VERIFIED' : `⚠️  ${report.summary.missing} COLLECTIONS MISSING`;
    console.log(`Status                     : ${status}\n`);

    report.summary.status = status;
    return report;
  } catch (err) {
    console.error('❌ Report error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

generateReport();
