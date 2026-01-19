import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DBNAME = 'ARABI_CALL';

async function checkTranscriptField() {
  try {
    console.log('Connecting to MongoDB...');
    const baseUri = process.env.MONGO_DB_URI;
    const hasQueryParams = baseUri.includes('?');
    const connectionString = hasQueryParams 
      ? baseUri.replace('/?', `/${DBNAME}?`)
      : `${baseUri}/${DBNAME}`;
    
    await mongoose.connect(connectionString);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);
    
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    // Check all documents for transcript field
    const allDocs = await transcribersCollection.find().limit(10).toArray();
    
    console.log('\n📊 Checking for transcript field in documents...\n');
    
    allDocs.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`);
      console.log('  _id:', doc._id);
      console.log('  agent:', doc.agent);
      console.log('  Has transcript field:', 'transcript' in doc);
      if ('transcript' in doc) {
        console.log('  Transcript preview:', doc.transcript.substring(0, 100) + '...');
      }
      console.log('  All keys:', Object.keys(doc));
      console.log('');
    });
    
    // Count documents with transcript field
    const withTranscript = await transcribersCollection.countDocuments({ transcript: { $exists: true } });
    const withoutTranscript = await transcribersCollection.countDocuments({ transcript: { $exists: false } });
    
    console.log('\n📈 Summary:');
    console.log(`  Documents WITH transcript: ${withTranscript}`);
    console.log(`  Documents WITHOUT transcript: ${withoutTranscript}`);
    console.log(`  Total documents: ${withTranscript + withoutTranscript}`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTranscriptField();
