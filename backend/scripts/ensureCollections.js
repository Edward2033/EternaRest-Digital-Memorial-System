require('dotenv').config();
const mongoose = require('mongoose');

// Load all models to ensure collections are registered
require('../models/Role');
require('../models/Setting');
require('../models/Package');
require('../models/Payment');
require('../models/FamilyAccount');
require('../models/Comment');
require('../models/ActivityLog');
require('../models/User');

async function ensureCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // Collections that need to be force-created (insert + delete a placeholder)
  const toCreate = ['users', 'payments', 'familyaccounts'];

  for (const name of toCreate) {
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length === 0) {
      // Insert then immediately remove a placeholder to create the collection
      const result = await db.collection(name).insertOne({ _placeholder: true });
      await db.collection(name).deleteOne({ _id: result.insertedId });
      console.log(`✅ Collection created: ${name}`);
    } else {
      console.log(`⏭️  Collection already exists: ${name}`);
    }
  }

  console.log('\n✅ All collections initialized.');
  await mongoose.disconnect();
}

ensureCollections().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
