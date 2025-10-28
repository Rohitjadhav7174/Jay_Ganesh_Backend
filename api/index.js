const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/test?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// Location-based default data
const locationDefaults = {
  Ratanagiri: {
    supplier: {
      name: "Sanvi Trading company",
      address: "H-3 nancy cottage Sant Dnyaneshwar Road , \n Near Jain Mandir,Nancy Bus Depo,\n Borivali(East) , Mumbai-400066",
      GSTIN: "27AJOPM9365R1ZX" 
    },
    buyer: {
      name: "Jay Ganesh Transport",
      address: "Shahu Market Yard, Kolhapur - 416005",
      pan: "AQRPJ6441R"
    },
    bankDetails: {
      name: "BANK OF BARODA",
      accountNumber: "37560200000273",
      branch: "Ruikar Colony, Kolhapur, Maharashtra",
      ifsc: "BARB0RUIKAR"
    },
    destination: "Ratanagiri",
    modeOfPayment: "BANK Transaction"
  },
  Singhururg: {
    supplier: {
      name: "PARSHWANATH TRADERS",
      address: "RAJMATA COMPLEX, PARLI, PARLI-V, Beed. Maharasthra 431515",
      gstin: ""
    },
    buyer: {
      name: "A.R.Trading Company",
      address: "Shahu Market Yard, Kolhapur - 416005",
      pan: "AQRPJ6441R"
    },
    bankDetails: {
      name: "kotak mahindra bank",
      accountNumber: "2348281967",
      branch: "Rajarampuri, Kolhapur, Maharashtra",
      ifsc: "KKBK0000692"
    },
    destination: "Singhururg",
    modeOfPayment: "BANK Transaction"
  }
};

// Fixed authentication middleware
const authenticateToken = (req) => {
  const authHeader = req.headers?.authorization;
  
  if (!authHeader) {
    throw new Error('Access token required');
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    throw new Error('Access token required');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

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
    console.log(`📥 ${req.method} ${req.url}`);

    const client = await connectToDatabase();
    const db = client.db('billing-system');

    const { url, method, headers } = req;
    const path = url.split('?')[0]; // Remove query parameters
    const pathParts = path.split('/').filter(part => part);

    console.log(`Processing: ${method} ${path}`);

    // Root endpoint
    if (path === '/' || path === '') {
      console.log('Serving root endpoint');
      res.json({
        message: '✅ Billing System API is running on Vercel!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        availableEndpoints: [
          'GET /api/health',
          'GET /api/test-db',
          'POST /api/create-default-user',
          'GET /api/location-defaults',
          'GET /api/location-defaults/:location',
          'POST /api/register',
          'POST /api/login',
          'GET /api/bills',
          'GET /api/bills/:location',
          'POST /api/bills'
        ]
      });
      return;
    }

    // Health check
    if (path === '/api/health') {
      console.log('Serving health check');
      res.json({
        message: '✅ Server is running!',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      return;
    }

    // Test database
    if (path === '/api/test-db') {
      console.log('Testing database connection');
      try {
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
      } catch (dbError) {
        console.error('Database test error:', dbError);
        res.status(500).json({
          message: 'Database test failed',
          error: dbError.message
        });
      }
      return;
    }

    // Create default user
    if (path === '/api/create-default-user' && method === 'POST') {
      console.log('Creating default user');
      try {
        const usersCollection = db.collection('users');
        
        const existingUser = await usersCollection.findOne({ username: 'admin' });
        if (existingUser) {
          res.json({
            message: 'Default user already exists',
            username: 'admin',
            password: 'admin123'
          });
          return;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        await usersCollection.insertOne({
          username: 'admin',
          password: hashedPassword,
          createdAt: new Date()
        });

        res.json({
          message: 'Default user created successfully!',
          username: 'admin',
          password: 'admin123'
        });
      } catch (userError) {
        console.error('Create user error:', userError);
        res.status(500).json({
          message: 'Error creating default user',
          error: userError.message
        });
      }
      return;
    }

    // Get location defaults
    if (path === '/api/location-defaults' && method === 'GET') {
      console.log('Serving location defaults');
      res.json(locationDefaults);
      return;
    }

    // Get specific location defaults
    if (pathParts[0] === 'api' && pathParts[1] === 'location-defaults' && pathParts[2] && method === 'GET') {
      const location = pathParts[2];
      console.log(`Serving location defaults for: ${location}`);
      const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
      
      res.json({
        location,
        ...defaults
      });
      return;
    }

    // Handle unknown routes
    console.log(`Route not found: ${method} ${path}`);
    res.status(404).json({
      message: 'Route not found',
      path: path,
      method: method,
      availableRoutes: [
        'GET /',
        'GET /api/health',
        'GET /api/test-db',
        'POST /api/create-default-user',
        'GET /api/location-defaults',
        'GET /api/location-defaults/:location'
      ]
    });

  } catch (error) {
    console.error('💥 Server Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      message: 'Internal server error',
      error: error.message, // Show actual error in production for debugging
      timestamp: new Date().toISOString()
    });
  }
};
