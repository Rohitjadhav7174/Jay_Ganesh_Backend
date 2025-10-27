const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Bill, User, locationDefaults } = require('./models/Bill');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your-secret-key';

// Enable CORS for all routes - MUST BE FIRST
app.use(cors({
  origin: true, // Allow any origin for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parser
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
mongoose.connect('mongodb+srv://Rohit:2428@cluster0.uh0sdkg.mongodb.net/?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

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

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Billing System API is running!',
    endpoints: {
      health: '/api/health',
      register: '/api/register (POST)',
      login: '/api/login (POST)',
      bills: '/api/bills (GET, POST)',
      billsByLocation: '/api/bills/:location (GET)',
      locationDefaults: '/api/location-defaults/:location (GET)'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
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

// Register (for initial setup)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check if user already exists
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
    console.log('🔐 Login attempt:', req.body.username);
    
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
    
    console.log('✅ Login successful for:', username);
    
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

// Get bill by ID
app.get('/api/bills/id/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findById(id).populate('createdBy', 'username');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Get bill by ID error:', error);
    res.status(500).json({ message: 'Error fetching bill', error: error.message });
  }
});

// Create new bill
app.post('/api/bills', authenticateToken, async (req, res) => {
  try {
    const { location, ...otherData } = req.body;
    
    // Validate required fields
    if (!otherData.billNumber || !otherData.date) {
      return res.status(400).json({ message: 'Bill number and date are required' });
    }
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required (Ratanagiri or Singhururg)' });
    }
    
    // Validate items
    if (!otherData.items || !Array.isArray(otherData.items) || otherData.items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    
    // Calculate totals if not provided
    let subtotal = otherData.subtotal;
    let totalAmount = otherData.totalAmount;
    
    if (!subtotal || !totalAmount) {
      subtotal = otherData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      totalAmount = subtotal;
    }
    
    // Get defaults for the location and merge with provided data
    const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
    
    const billData = {
      ...defaults,
      ...otherData,
      location,
      subtotal,
      totalAmount,
      createdBy: req.user.userId
    };
    
    // Validate final bill data
    const bill = new Bill(billData);
    await bill.validate();
    
    await bill.save();
    
    // Populate the createdBy field before sending response
    await bill.populate('createdBy', 'username');
    
    console.log(`✅ Bill created successfully: ${bill.billNumber} for ${location}`);
    
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
    
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
});

// Update bill
app.put('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const { date, billNumber, items, location, ...otherData } = req.body;
    
    // Find existing bill
    const existingBill = await Bill.findById(id);
    if (!existingBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Calculate new amounts if items are updated
    let updateData = { date, billNumber, ...otherData };
    
    if (items && Array.isArray(items)) {
      const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      updateData.items = items;
      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal;
    }
    
    // If location is changed, apply new defaults for missing fields
    if (location && location !== existingBill.location) {
      const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
      
      // Only apply defaults if the corresponding field is not being updated
      if (!updateData.supplier) updateData.supplier = defaults.supplier;
      if (!updateData.buyer) updateData.buyer = defaults.buyer;
      if (!updateData.bankDetails) updateData.bankDetails = defaults.bankDetails;
      if (!updateData.destination) updateData.destination = defaults.destination;
      
      updateData.location = location;
    }
    
    const bill = await Bill.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    console.log(`✅ Bill updated successfully: ${bill.billNumber}`);
    
    res.json({
      message: 'Bill updated successfully',
      bill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Error updating bill', error: error.message });
  }
});

// Delete bill
app.delete('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findByIdAndDelete(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    console.log(`🗑️ Bill deleted: ${bill.billNumber}`);
    
    res.json({ 
      message: 'Bill deleted successfully',
      deletedBill: {
        billNumber: bill.billNumber,
        location: bill.location
      }
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ message: 'Error deleting bill', error: error.message });
  }
});

// Get bill statistics
app.get('/api/bills-stats/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required (Ratanagiri or Singhururg)' });
    }
    
    const stats = await Bill.aggregate([
      { $match: { location } },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          averageAmount: { $avg: "$totalAmount" },
          minAmount: { $min: "$totalAmount" },
          maxAmount: { $max: "$totalAmount" }
        }
      }
    ]);
    
    const recentBills = await Bill.find({ location })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('billNumber date totalAmount');
    
    res.json({
      location,
      stats: stats[0] || {
        totalBills: 0,
        totalAmount: 0,
        averageAmount: 0,
        minAmount: 0,
        maxAmount: 0
      },
      recentBills
    });
  } catch (error) {
    console.error('Get bill stats error:', error);
    res.status(500).json({ message: 'Error fetching bill statistics', error: error.message });
  }
});

// Search bills
app.get('/api/bills-search/:location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.params;
    const { query } = req.query;
    
    if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
      return res.status(400).json({ message: 'Valid location is required (Ratanagiri or Singhururg)' });
    }
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const bills = await Bill.find({
      location,
      $or: [
        { billNumber: { $regex: query, $options: 'i' } },
        { 'supplier.name': { $regex: query, $options: 'i' } },
        { 'buyer.name': { $regex: query, $options: 'i' } },
        { 'items.description': { $regex: query, $options: 'i' } }
      ]
    })
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });
    
    res.json({
      location,
      query,
      count: bills.length,
      bills
    });
  } catch (error) {
    console.error('Search bills error:', error);
    res.status(500).json({ message: 'Error searching bills', error: error.message });
  }
});

// Simple 404 handler for all other routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log('📊 Available Locations:', Object.keys(locationDefaults).join(', '));
  console.log('='.repeat(50));
});
