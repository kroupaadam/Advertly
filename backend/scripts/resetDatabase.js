import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Drop the entire User collection
    try {
      await User.collection.drop();
      console.log('✅ User collection dropped');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️  User collection doesn\'t exist');
      } else {
        throw error;
      }
    }

    // Create indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Indexes created');

    // Verify collection structure
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollection = collections.find(c => c.name === 'users');
    
    if (userCollection) {
      console.log('✅ Users collection exists and is ready');
    }

    console.log('\n🎉 Database has been reset successfully!');
    console.log('The Users collection is now clean and ready for use.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
