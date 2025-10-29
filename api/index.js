const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/test?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// MongoDB Connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
  }
};

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  supplier: {
    name: String,
    address: String,
    gstin: String
  },
  buyer: {
    name: String,
    address: String,
    pan: String
  },
  items: [{
    description: String,
    hsnSac: String,
    gstRate: String,
    quantity: Number,
    rate: Number,
    unit: String,
    amount: Number
  }],
  subtotal: Number,
  totalAmount: Number,
  bankDetails: {
    name: String,
    accountNumber: String,
    branch: String,
    ifsc: String
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Bill = mongoose.model('Bill', billSchema);

// Location defaults
const locationDefaults = {
  Ratanagiri: {
    supplier: {
      name: "Sanvi Trading company",
      address: "H-3 nancy cottage Sant Dnyaneshwar Road \n  Near Jain Mandir, Nancy Bus Depo \n  Borivali(East), Mumbai-400066",
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

// Database middleware
app.use(async (req, res, next) => {
  await connectDB();
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

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'Connected' : 'Disconnected'
  });
});

// Create default user
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
    
    res.json({ 
      message: 'Default user created successfully!',
      username: 'admin',
      password: 'admin123'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating default user', 
      error: error.message
    });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get location defaults
app.get('/api/location-defaults/:location', (req, res) => {
  try {
    const { location } = req.params;
    const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
    
    res.json({
      location,
      ...defaults
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching location defaults', error: error.message });
  }
});

// Get all location defaults
app.get('/api/location-defaults', (req, res) => {
  res.json(locationDefaults);
});

// Get bills by location
app.get('/api/bills/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' });
    }
    
    const bills = await Bill.find({ location }).sort({ createdAt: -1 });
    
    res.json({
      location,
      count: bills.length,
      bills
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
});

// Create new bill
app.post('/api/bills', authenticateToken, async (req, res) => {
  try {
    const { location, ...billData } = req.body;
    
    if (!billData.billNumber || !billData.date) {
      return res.status(400).json({ message: 'Bill number and date are required' });
    }
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' });
    }
    
    const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
    
    const completeBillData = {
      ...defaults,
      ...billData,
      location,
      createdBy: req.user.userId
    };
    
    const bill = new Bill(completeBillData);
    await bill.save();
    
    res.status(201).json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
});

// Update bill - ADD THIS ROUTE
app.put('/api/bills/:billId', authenticateToken, async (req, res) => {
  try {
    const { billId } = req.params;
    const { location, ...billData } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    if (!billData.billNumber || !billData.date) {
      return res.status(400).json({ message: 'Bill number and date are required' });
    }
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required' });
    }
    
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Update bill with new data
    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        ...billData,
        location,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Bill updated successfully',
      bill: updatedBill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ 
      message: 'Error updating bill', 
      error: error.message 
    });
  }
});

// Delete bill
app.delete('/api/bills/:billId', authenticateToken, async (req, res) => {
  try {
    const { billId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    await Bill.findByIdAndDelete(billId);
    
    res.json({ 
      message: 'Bill deleted successfully',
      deletedBillId: billId
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ 
      message: 'Error deleting bill', 
      error: error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Billing System API is running on Vercel!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'POST /api/create-default-user',
      'POST /api/login',
      'GET /api/location-defaults',
      'GET /api/location-defaults/:location',
      'GET /api/bills/:location',
      'POST /api/bills',
      'PUT /api/bills/:billId',
      'DELETE /api/bills/:billId'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export for Vercel
module.exports = app;
