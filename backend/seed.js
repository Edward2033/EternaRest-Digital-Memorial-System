require('dotenv').config();
require('./models/index'); // register all models
const mongoose = require('mongoose');
const Role    = require('./models/Role');
const Package = require('./models/Package');
const Setting = require('./models/Setting');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
};

// ─── PHASE 9: Roles ──────────────────────────────────────────────────────────
const ROLES = [
  { name: 'super_admin',  displayName: 'Super Admin',   permissions: ['*'] },
  { name: 'admin',        displayName: 'Admin',          permissions: ['manage_bookings','manage_memorials','manage_users','manage_settings'] },
  { name: 'manager',      displayName: 'Manager',        permissions: ['manage_bookings','manage_memorials'] },
  { name: 'editor',       displayName: 'Editor',         permissions: ['manage_memorials','manage_media'] },
  { name: 'family',       displayName: 'Family',         permissions: ['view_memorial','upload_media','add_comment'] },
  { name: 'viewer',       displayName: 'Viewer',         permissions: ['view_memorial'] },
];

// ─── PHASE 9: Packages ───────────────────────────────────────────────────────
const PACKAGES = [
  {
    name: 'essential',
    displayName: 'Essential',
    price: 99,
    description: 'A dignified remembrance for your loved one.',
    features: ['Memorial page', 'QR code', 'Up to 5 photos', '1 year hosting'],
    maxMediaUploads: 5,
    maxTributes: 20,
    durationDays: 365,
    sortOrder: 1,
  },
  {
    name: 'premium',
    displayName: 'Premium',
    price: 199,
    description: 'Enhanced memorial with full media gallery.',
    features: ['Memorial page', 'QR code', 'Up to 20 photos', 'Video support', '3 years hosting', 'Family account'],
    badge: 'Popular',
    featured: true,
    maxMediaUploads: 20,
    maxTributes: 100,
    durationDays: 1095,
    sortOrder: 2,
  },
  {
    name: 'legacy',
    displayName: 'Legacy',
    price: 349,
    description: 'Lifetime memorial with all premium features.',
    features: ['Memorial page', 'QR code', 'Unlimited photos & videos', 'Lifetime hosting', 'Family account', 'Priority support', 'Custom biography'],
    badge: 'Best Value',
    maxMediaUploads: 999,
    maxTributes: 999,
    durationDays: 36500,
    sortOrder: 3,
  },
];

// ─── PHASE 10: Settings ──────────────────────────────────────────────────────
const SETTINGS = [
  // General
  { key: 'site_name',       value: 'EternaRest Memorial',         group: 'general',   isPublic: true  },
  { key: 'logo',            value: '/uploads/logo.png',           group: 'general',   isPublic: true  },
  { key: 'favicon',         value: '/uploads/favicon.ico',        group: 'general',   isPublic: true  },
  { key: 'site_email',      value: 'info@eternarest.com',         group: 'general',   isPublic: true  },
  { key: 'site_phone',      value: '+1 (555) 000-0000',           group: 'general',   isPublic: true  },
  { key: 'address',         value: '123 Memorial Drive, City',    group: 'general',   isPublic: true  },
  { key: 'footer_text',     value: '© 2025 EternaRest Memorial. All rights reserved.', group: 'general', isPublic: true },
  // Social
  { key: 'facebook',        value: 'https://facebook.com/eternarest',   group: 'social', isPublic: true },
  { key: 'instagram',       value: 'https://instagram.com/eternarest',  group: 'social', isPublic: true },
  { key: 'telegram',        value: 'https://t.me/eternarest',           group: 'social', isPublic: true },
  { key: 'youtube',         value: 'https://youtube.com/@eternarest',   group: 'social', isPublic: true },
  // SEO
  { key: 'meta_title',       value: 'EternaRest — Digital Memorial Services', group: 'seo', isPublic: true },
  { key: 'meta_description', value: 'Create lasting digital memorials for your loved ones.', group: 'seo', isPublic: true },
  { key: 'keywords',         value: 'memorial, burial, niche, tribute, QR code, remembrance', group: 'seo', isPublic: true },
  // Payments
  { key: 'mtn_momo',        value: '',             group: 'payment', isPublic: false },
  { key: 'airtel_money',    value: '',             group: 'payment', isPublic: false },
  { key: 'bank_name',       value: '',             group: 'payment', isPublic: false },
  { key: 'bank_account',    value: '',             group: 'payment', isPublic: false },
  { key: 'account_holder',  value: '',             group: 'payment', isPublic: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const upsertOnly = async (Model, key, docs) => {
  let inserted = 0;
  let skipped  = 0;
  for (const doc of docs) {
    const exists = await Model.findOne({ [key]: doc[key] });
    if (!exists) {
      await Model.create(doc);
      inserted++;
      console.log(`  ✅ Inserted ${key}="${doc[key]}"`);
    } else {
      skipped++;
    }
  }
  console.log(`  → ${inserted} inserted, ${skipped} already existed`);
};

// ─── PHASE 8: Ensure indexes ─────────────────────────────────────────────────
const ensureIndexes = async () => {
  const models = Object.values(require('./models/index'));
  for (const Model of models) {
    try {
      await Model.createIndexes();
    } catch (e) {
      console.warn(`  ⚠ Index warning on ${Model.modelName}: ${e.message}`);
    }
  }
  console.log('✅ All indexes ensured');
};

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();

    console.log('\n📦 PHASE 8 — Ensuring indexes...');
    await ensureIndexes();

    console.log('\n👥 PHASE 9 — Seeding roles...');
    await upsertOnly(Role, 'name', ROLES);

    console.log('\n📦 PHASE 9 — Seeding packages...');
    await upsertOnly(Package, 'name', PACKAGES);

    console.log('\n⚙️  PHASE 10 — Seeding settings...');
    await upsertOnly(Setting, 'key', SETTINGS);

    console.log('\n✅ Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
