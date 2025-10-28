const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/test?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();

// CORS - Allow all origins for Vercel
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// MongoDB Connection with Vercel optimization
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    console.log('🔄 Establishing new MongoDB connection...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      bufferCommands: false,
    });

    isConnected = mongoose.connection.readyState === 1;
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('💥 MongoDB connection failed:', error.message);
    isConnected = false;
  }
};

// Connect to DB on server start
connectDB();

// MongoDB Schemas
const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    enum: ['Ratanagiri', 'Singhururg']
  },
  supplier: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    gstin: { type: String, default: "" }
  },
  buyer: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    pan: { type: String, required: true }
  },
  deliveryNote: { type: String, default: "" },
  modeOfPayment: { type: String, default: "BANK Transaction" },
  dispatchedThrough: { type: String, default: "" },
  destination: { type: String, required: true },
  items: [{
    description: { type: String, required: true },
    hsnSac: { type: String, default: "" },
    gstRate: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "KG" },
    amount: { type: Number, required: true, min: 0 }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  bankDetails: {
    name: { type: String, required: true },
    accountNumber: { type: String, required: true },
    branch: { type: String, required: true },
    ifsc: { type: String, default: "" }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
});

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

const Bill = mongoose.model('Bill', billSchema);
const User = mongoose.model('User', userSchema);

// Database connection middleware
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
  }
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Root endpoint
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({ 
    message: 'Billing System API is running on Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: statusMap[dbStatus],
    databaseCode: dbStatus,
    vercel: true
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  let dbTest = 'Not tested';
  try {
    if (dbStatus === 1) {
      const count = await User.countDocuments();
      dbTest = `Working (${count} users)`;
    }
  } catch (error) {
    dbTest = `Error: ${error.message}`;
  }
  
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    status: 'OK',
    database: statusMap[dbStatus],
    databaseTest: dbTest,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    
    let connectionInfo = {
      connectionState: dbStatus,
      connectionStateText: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbStatus],
      environment: process.env.NODE_ENV || 'development'
    };

    if (dbStatus === 1) {
      const userCount = await User.countDocuments();
      const billCount = await Bill.countDocuments();
      connectionInfo.userCount = userCount;
      connectionInfo.billCount = billCount;
      connectionInfo.databaseTest = 'Successful';
    }

    res.json({
      message: 'Database connection test completed',
      ...connectionInfo
    });

  } catch (error) {
    res.status(500).json({
      message: 'Database test failed',
      error: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

// Create default user endpoint
app.post('/api/create-default-user', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      return res.json({ 
        message: 'Default user already exists',
        username: 'admin',
        password: 'admin123'
      });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = new User({
      username: 'admin',
      password: hashedPassword
    });

    await user.save();
    
    res.status(201).json({ 
      message: 'Default user created successfully!',
      username: 'admin',
      password: 'admin123'
    });
  } catch (error) {
    console.error('Create default user error:', error);
    res.status(500).json({ 
      message: 'Error creating default user', 
      error: error.message
    });
  }
});

// Get location defaults
app.get('/api/location-defaults/:location', (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location) {
      return res.status(400).json({ message: 'Location parameter is required' });
    }

    const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
    
    res.json({
      location,
      ...defaults
    });
  } catch (error) {
    console.error('Get location defaults error:', error);
    res.status(500).json({ message: 'Error fetching location defaults', error: error.message });
  }
});

// Get all location defaults
app.get('/api/location-defaults', (req, res) => {
  try {
    res.json(locationDefaults);
  } catch (error) {
    console.error('Get all location defaults error:', error);
    res.status(500).json({ message: 'Error fetching location defaults', error: error.message });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Login successful',
      token, 
      user: { id: user._id, username: user.username } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bills
app.get('/api/bills', authenticateToken, async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
});

// Get bills by location
app.get('/api/bills/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required (Ratanagiri or Singhururg)' });
    }
    
    const bills = await Bill.find({ location })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json({
      location,
      count: bills.length,
      bills
    });
  } catch (error) {
    console.error('Get bills by location error:', error);
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
});

// Create new bill
app.post('/api/bills', authenticateToken, async (req, res) => {
  try {
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
      createdBy: req.user.userId
    };
    
    const bill = new Bill(billData);
    await bill.save();
    await bill.populate('createdBy', 'username');
    
    res.status(201).json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bill number already exists' 
      });
    }
    
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Export for Vercel
module.exports = app;
