require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).then(async () => {
  const admin = await Admin.findOne({ username: 'admin' }, 'username email isActive role').lean();
  console.log(JSON.stringify(admin, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
