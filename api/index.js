const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/?retryWrites=true&w=majority';

const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db('billing-system');
    
    // Handle different routes
    const { path } = req;
    
    if (path === '/api/health' || path === '/') {
      res.json({
        message: 'Billing System API is running on Vercel!',
        database: 'Connected',
        timestamp: new Date().toISOString()
      });
    }
    else if (path === '/api/test-db') {
      const users = db.collection('users');
      const userCount = await users.countDocuments();
      
      res.json({
        message: 'Database test successful',
        userCount: userCount,
        database: 'Connected'
      });
    }
    else {
      res.status(404).json({ 
        message: 'Route not found',
        path: path
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};
