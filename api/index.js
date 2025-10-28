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

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  return client;
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

// Authentication middleware
const authenticateToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

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
    const client = await connectToDatabase();
    const db = client.db('billing-system');

    const { path, method } = req;
    const pathParts = path.split('/').filter(part => part);

    console.log(`Request: ${method} ${path}`);

    // Root endpoint
    if (path === '/' || path === '') {
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
      return;
    }

    // Get location defaults
    if (path === '/api/location-defaults' && method === 'GET') {
      res.json(locationDefaults);
      return;
    }

    // Get specific location defaults
    if (pathParts[0] === 'api' && pathParts[1] === 'location-defaults' && pathParts[2] && method === 'GET') {
      const location = pathParts[2];
      const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
      
      res.json({
        location,
        ...defaults
      });
      return;
    }

    // Register user
    if (path === '/api/register' && method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const usersCollection = db.collection('users');
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await usersCollection.insertOne({
        username,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      res.status(201).json({ message: 'User created successfully' });
      return;
    }

    // Login
    if (path === '/api/login' && method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        message: 'Login successful',
        token, 
        user: { id: user._id.toString(), username: user.username } 
      });
      return;
    }

    // Get all bills (protected)
    if (path === '/api/bills' && method === 'GET') {
      try {
        const user = authenticateToken(req);
        const billsCollection = db.collection('bills');
        
        const bills = await billsCollection.find().sort({ createdAt: -1 }).toArray();
        res.json(bills);
      } catch (authError) {
        res.status(401).json({ message: authError.message });
      }
      return;
    }

    // Get bills by location (protected)
    if (pathParts[0] === 'api' && pathParts[1] === 'bills' && pathParts[2] && method === 'GET') {
      try {
        const user = authenticateToken(req);
        const location = pathParts[2];
        
        if (!['Ratanagiri', 'Singhururg'].includes(location)) {
          return res.status(400).json({ message: 'Valid location is required (Ratanagiri or Singhururg)' });
        }
        
        const billsCollection = db.collection('bills');
        const bills = await billsCollection.find({ location }).sort({ createdAt: -1 }).toArray();
        
        res.json({
          location,
          count: bills.length,
          bills
        });
      } catch (authError) {
        res.status(401).json({ message: authError.message });
      }
      return;
    }

    // Create new bill (protected)
    if (path === '/api/bills' && method === 'POST') {
      try {
        const user = authenticateToken(req);
        const { location, ...otherData } = req.body;
        
        if (!otherData.billNumber || !otherData.date) {
          return res.status(400).json({ message: 'Bill number and date are required' });
        }
        
        if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
          return res.status(400).json({ message: 'Valid location is required (Ratanagiri or Singhururg)' });
        }
        
        if (!otherData.items || !Array.isArray(otherData.items) || otherData.items.length === 0) {
          return res.status(400).json({ message: 'At least one item is required' });
        }
        
        const subtotal = otherData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalAmount = subtotal;
        
        const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
        
        const billData = {
          ...defaults,
          ...otherData,
          location,
          subtotal,
          totalAmount,
          createdBy: user.userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const billsCollection = db.collection('bills');
        const result = await billsCollection.insertOne(billData);
        
        const newBill = {
          _id: result.insertedId,
          ...billData
        };
        
        res.status(201).json({
          message: 'Bill created successfully',
          bill: newBill
        });
      } catch (authError) {
        res.status(401).json({ message: authError.message });
      }
      return;
    }

    // Handle unknown routes
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
        'GET /api/location-defaults/:location',
        'POST /api/register',
        'POST /api/login',
        'GET /api/bills',
        'GET /api/bills/:location',
        'POST /api/bills'
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
