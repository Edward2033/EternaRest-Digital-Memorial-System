require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const Setting = require('../models/Setting');
const Package = require('../models/Package');

const roles = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    permissions: ['*'],
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    permissions: ['bookings:read', 'bookings:write', 'memorials:read', 'memorials:write', 'comments:moderate', 'media:write', 'payments:read'],
  },
  {
    name: 'moderator',
    displayName: 'Moderator',
    permissions: ['comments:moderate', 'memorials:read', 'bookings:read'],
  },
  {
    name: 'family_member',
    displayName: 'Family Member',
    permissions: ['memorials:read', 'comments:write', 'media:write'],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    permissions: ['memorials:read'],
  },
];

const settings = [
  { key: 'site_name', value: 'EternaRest Memorial Services', group: 'general', description: 'Public site name', isPublic: true },
  { key: 'site_tagline', value: 'Honoring Lives, Preserving Memories', group: 'general', description: 'Site tagline', isPublic: true },
  { key: 'contact_email', value: 'support@eternarest.com', group: 'general', description: 'Support contact email', isPublic: true },
  { key: 'booking_approval_required', value: true, group: 'general', description: 'Whether bookings require manual admin approval' },
  { key: 'max_media_per_memorial', value: 20, group: 'memorial', description: 'Maximum media files per memorial' },
  { key: 'comment_auto_approve', value: false, group: 'memorial', description: 'Auto-approve comments without moderation' },
  { key: 'qr_base_url', value: 'http://localhost:5000/memorial', group: 'memorial', description: 'Base URL used to generate QR codes' },
  { key: 'email_notifications_enabled', value: true, group: 'notifications', description: 'Enable email notifications on booking events' },
  { key: 'currency', value: 'USD', group: 'payment', description: 'Default currency for payments', isPublic: true },
];

const packages = [
  {
    name: 'standard',
    displayName: 'Standard',
    price: 199,
    features: ['Memorial page', 'Up to 10 photos', 'QR code', 'Public tributes', '1 year hosting'],
    maxMediaUploads: 10,
    maxTributes: 50,
    durationDays: 365,
  },
  {
    name: 'premium',
    displayName: 'Premium',
    price: 500,
    features: ['Memorial page', 'Up to 30 photos & videos', 'QR code', 'Public tributes', 'Background music', '3 years hosting', 'Priority support'],
    maxMediaUploads: 30,
    maxTributes: 200,
    durationDays: 1095,
  },
  {
    name: 'legacy',
    displayName: 'Legacy',
    price: 999,
    features: ['Memorial page', 'Unlimited photos & videos', 'QR code', 'Public tributes', 'Background music', 'Lifetime hosting', 'Dedicated support', 'Custom domain'],
    maxMediaUploads: 999,
    maxTributes: 999,
    durationDays: 36500,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const report = { roles: {}, settings: {}, packages: {} };

    // Seed Roles
    for (const roleData of roles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (existing) {
        console.log(`⏭️  Role already exists: ${roleData.name}`);
        report.roles[roleData.name] = 'skipped (already exists)';
      } else {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.name}`);
        report.roles[roleData.name] = 'created';
      }
    }

    // Seed Settings
    for (const settingData of settings) {
      const existing = await Setting.findOne({ key: settingData.key });
      if (existing) {
        console.log(`⏭️  Setting already exists: ${settingData.key}`);
        report.settings[settingData.key] = 'skipped (already exists)';
      } else {
        await Setting.create(settingData);
        console.log(`✅ Created setting: ${settingData.key}`);
        report.settings[settingData.key] = 'created';
      }
    }

    // Seed Packages
    for (const pkgData of packages) {
      const existing = await Package.findOne({ name: pkgData.name });
      if (existing) {
        console.log(`⏭️  Package already exists: ${pkgData.name} ($${pkgData.price})`);
        report.packages[pkgData.name] = 'skipped (already exists)';
      } else {
        await Package.create(pkgData);
        console.log(`✅ Created package: ${pkgData.name} ($${pkgData.price})`);
        report.packages[pkgData.name] = 'created';
      }
    }

    console.log('\n📋 Seed Summary:');
    console.log(JSON.stringify(report, null, 2));
    console.log('\n🎉 Seeding complete.');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
