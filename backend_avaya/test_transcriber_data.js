import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DBNAME = 'ARABI_CALL';

async function testTranscriberData() {
  try {
    console.log('Connecting to MongoDB...');
    const baseUri = process.env.MONGO_DB_URI;
    const hasQueryParams = baseUri.includes('?');
    const connectionString = hasQueryParams 
      ? baseUri.replace('/?', `/${DBNAME}?`)
      : `${baseUri}/${DBNAME}`;
    
    await mongoose.connect(connectionString);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);
    
    // List all collections in this database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 All collections in database:');
    collections.forEach(coll => console.log(`  - ${coll.name}`));
    
    // Get the transcriber collection (singular, not plural!)
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    // Count documents
    const count = await transcribersCollection.countDocuments();
    console.log(`\n📊 Total documents in transcribers collection: ${count}`);
    
    // Get one sample document
    const sample = await transcribersCollection.findOne();
    console.log('\n📄 Sample document structure:');
    console.log('Keys:', sample ? Object.keys(sample) : 'No document found');
    console.log('\nFull sample document:');
    console.log(JSON.stringify(sample, null, 2));
    
    // List all unique agents
    const agents = await transcribersCollection.distinct('agent');
    console.log('\n👥 Unique agents found:');
    console.log(agents);
    
    // Test the aggregation pipeline
    console.log('\n🔍 Testing aggregation pipeline...');
    const agentsWithStats = await transcribersCollection.aggregate([
      {
        $group: {
          _id: '$agent',
          agentName: { $first: '$agent' },
          callCount: { $sum: 1 },
          avgScore: { 
            $avg: { 
              $divide: ['$message.call_quality_metrics.call_structure.structure_score', 20] 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          agentName: 1,
          callCount: 1,
          avgScore: { $ifNull: ['$avgScore', 0] }
        }
      },
      {
        $sort: { callCount: -1 }
      }
    ]).toArray();
    
    console.log('\n📈 Agents with stats (aggregation result):');
    console.log(JSON.stringify(agentsWithStats, null, 2));
    
    await mongoose.connection.close();
    console.log('\n✅ Test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTranscriberData();
