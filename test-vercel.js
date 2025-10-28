// Simple test to check if the basic setup works
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/test?retryWrites=true&w=majority';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const db = client.db('billing-system');
    const collections = await db.listCollections().toArray();
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

testConnection();
