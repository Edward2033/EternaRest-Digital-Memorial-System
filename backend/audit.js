require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  const names = cols.map(c => c.name).sort();
  console.log('=== ALL COLLECTIONS IN eternarest ===');
  console.log(names.join(', '));
  console.log('');

  for (const n of names) {
    const count = await db.collection(n).countDocuments();
    const idx = await db.collection(n).indexes();
    const sample = await db.collection(n).findOne({}, { projection: { password: 0 } });
    console.log('COL=' + n + ' | DOCS=' + count);
    console.log('IDX=' + idx.map(i => JSON.stringify(i.key)).join(' | '));
    if (sample) console.log('FIELDS=' + Object.keys(sample).join(', '));
    else console.log('FIELDS=<empty collection>');
    console.log('');
  }
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
