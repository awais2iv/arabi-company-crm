import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin_zeluai:awaisdev.pro942@zeluai.8kyhme9.mongodb.net/ARABI_CALL?appName=ZeluAI';

async function dropUniqueIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const db = mongoose.connection.db;
    const collection = db.collection('workorders');

    // Get all indexes
    console.log('\nCurrent indexes on workorders collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the unique index on workOrderNumber
    try {
      console.log('\nDropping workOrderNumber_1 index...');
      await collection.dropIndex('workOrderNumber_1');
      console.log('✅ Successfully dropped workOrderNumber_1 unique index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  Index workOrderNumber_1 does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // Drop the compound index on workOrderNumber and isDeleted
    try {
      console.log('\nDropping workOrderNumber_1_isDeleted_1 index...');
      await collection.dropIndex('workOrderNumber_1_isDeleted_1');
      console.log('✅ Successfully dropped workOrderNumber_1_isDeleted_1 compound index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  Index workOrderNumber_1_isDeleted_1 does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // Show remaining indexes
    console.log('\nRemaining indexes:');
    const remainingIndexes = await collection.indexes();
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Operation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

dropUniqueIndex();
