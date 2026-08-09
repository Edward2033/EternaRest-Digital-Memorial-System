require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await Admin.updateOne(
    { username: 'admin' },
    { $set: { isActive: true } }
  );
  console.log('Updated:', result.modifiedCount, 'document(s)');

  const admin = await Admin.findOne({ username: 'admin' }, 'username email isActive role').lean();
  console.log('Admin now:', admin);

  await mongoose.disconnect();
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
