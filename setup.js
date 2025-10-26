const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models/Bill');

const createDefaultUser = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect('mongodb+srv://Rohit:2428@cluster0.uh0sdkg.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');

    // Check if user already exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('ℹ️  Default user already exists');
      console.log('📋 Username: admin');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    // Create default user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = new User({
      username: 'admin',
      password: hashedPassword
    });

    await user.save();
    console.log('✅ Default user created successfully!');
    console.log('📋 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('💡 You can now login with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating default user:', error.message);
    process.exit(1);
  }
};

createDefaultUser();