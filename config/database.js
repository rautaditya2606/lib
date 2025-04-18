const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let retries = 5;
    while (retries > 0) {
      try {
        const credentials = encodeURIComponent(process.env.MONGODB_PASSWORD);
        const uri = `mongodb://${process.env.MONGODB_USERNAME}:${credentials}@127.0.0.1:27017/library_system`;
        
        await mongoose.connect(uri, {
          authSource: 'admin',
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          w: 'majority'
        });

        const db = mongoose.connection.db;
        await db.command({ ping: 1 });

        // Create necessary indexes
        await Promise.all([
          db.collection('users').createIndex({ email: 1 }, { unique: true }),
          db.collection('users').createIndex({ studentId: 1 }, { sparse: true }),
          db.collection('books').createIndex({ title: 1 }),
          db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
        ]);

        console.log('MongoDB connected and indexes created successfully');
        return mongoose.connection;

      } catch (err) {
        retries -= 1;
        if (retries === 0) throw err;
        console.log(`Retrying connection... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
