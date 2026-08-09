require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new Admin({
      username: 'admin',
      email: 'admin@eternarest.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
