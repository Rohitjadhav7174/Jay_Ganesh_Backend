const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/test?retryWrites=true&w=majority';
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('billing-system');

    const { path, method } = req;

    console.log(`Request: ${method} ${path}`);

    // Health check
    if (path === '/api/health' || path === '/') {
      res.json({
        message: '✅ Billing System API is running!',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      return;
    }

    // Test database
    if (path === '/api/test-db') {
      const usersCollection = db.collection('users');
      const billsCollection = db.collection('bills');
      
      const userCount = await usersCollection.countDocuments();
      const billCount = await billsCollection.countDocuments();
      
      res.json({
        message: 'Database test completed',
        userCount: userCount,
        billCount: billCount,
        database: 'Connected'
      });
      return;
    }

    // Create default user
    if (path === '/api/create-default-user' && method === 'POST') {
      const usersCollection = db.collection('users');
      
      // Check if user exists
      const existingUser = await usersCollection.findOne({ username: 'admin' });
      if (existingUser) {
        res.json({
          message: 'Default user already exists',
          username: 'admin',
          password: 'admin123'
        });
        return;
      }

      // Create user (in a real app, you'd hash the password)
      await usersCollection.insertOne({
        username: 'admin',
        password: 'admin123', // In production, hash this!
        createdAt: new Date()
      });

      res.json({
        message: 'Default user created successfully!',
        username: 'admin',
        password: 'admin123'
      });
      return;
    }

    // Handle unknown routes
    res.status(404).json({
      message: 'Route not found',
      path: path,
      availableRoutes: [
        'GET /',
        'GET /api/health',
        'GET /api/test-db',
        'POST /api/create-default-user'
      ]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};
