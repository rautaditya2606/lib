const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = 'mongodb://127.0.0.1:27017/library_system';
    const options = {
      authSource: 'admin',
      user: 'adityaraut',
      pass: 'adi260606',
      serverSelectionTimeoutMS: 5000
    };

    await mongoose.connect(uri, options);
    console.log('MongoDB connected successfully');

    // Drop old indexes before seeding
    await mongoose.connection.db.collection('users').dropIndexes();
    
    // Test connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('Database ping successful');
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
