// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Environment variables
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Rohit:2428@cluster0.tupbuoz.mongodb.net/test?retryWrites=true&w=majority';
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// // MongoDB Connection
// let isConnected = false;

// const connectDB = async () => {
//   if (isConnected) {
//     return;
//   }

//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     isConnected = true;
//     console.log('✅ MongoDB connected successfully');
//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error);
//     isConnected = false;
//   }
// };

// // MongoDB Schemas
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true }
// }, { timestamps: true });

// const billSchema = new mongoose.Schema({
//   billNumber: { type: String, required: true },
//   date: { type: Date, required: true },
//   location: { type: String, required: true },
//   supplier: {
//     name: String,
//     address: String,
//     gstin: String
//   },
//   buyer: {
//     name: String,
//     address: String,
//     pan: String
//   },
//   items: [{
//     description: String,
//     hsnSac: String,
//     gstRate: String,
//     quantity: Number,
//     rate: Number,
//     unit: String,
//     amount: Number
//   }],
//   subtotal: Number,
//   totalAmount: Number,
//   bankDetails: {
//     name: String,
//     accountNumber: String,
//     branch: String,
//     ifsc: String
//   }
// }, { timestamps: true });

// const User = mongoose.model('User', userSchema);
// const Bill = mongoose.model('Bill', billSchema);

// // Location defaults
// const locationDefaults = {
//   Ratanagiri: {
//     supplier: {
//       name: "Sanvi Trading company",
//       address: "H-3 nancy cottage Sant Dnyaneshwar Road \n, Near Jain Mandir, Nancy Bus Depo \n, Borivali(East), Mumbai-400066",
//       GSTIN: "27AJOPM9365R1ZX" 
//     },
//     buyer: {
//       name: "Jay Ganesh Transport",
//       address: "Shahu Market Yard, Kolhapur - 416005",
//       pan: "AQRPJ6441R"
//     },
//     bankDetails: {
//       name: "BANK OF BARODA",
//       accountNumber: "37560200000273",
//       branch: "Ruikar Colony, Kolhapur, Maharashtra",
//       ifsc: "BARB0RUIKAR"
//     },
//     destination: "Ratanagiri",
//     modeOfPayment: "BANK Transaction"
//   },
//   Singhururg: {
//     supplier: {
//       name: "PARSHWANATH TRADERS",
//       address: "RAJMATA COMPLEX, PARLI, PARLI-V, Beed. Maharasthra 431515",
//       gstin: ""
//     },
//     buyer: {
//       name: "A.R.Trading Company",
//       address: "Shahu Market Yard, Kolhapur - 416005",
//       pan: "AQRPJ6441R"
//     },
//     bankDetails: {
//       name: "kotak mahindra bank",
//       accountNumber: "2348281967",
//       branch: "Rajarampuri, Kolhapur, Maharashtra",
//       ifsc: "KKBK0000692"
//     },
//     destination: "Singhururg",
//     modeOfPayment: "BANK Transaction"
//   }
// };

// // Database middleware
// app.use(async (req, res, next) => {
//   await connectDB();
//   next();
// });

// // Authentication middleware
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Access token required' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ message: 'Invalid token' });
//     }
//     req.user = user;
//     next();
//   });
// };

// // Routes

// // Health check
// app.get('/api/health', async (req, res) => {
//   res.json({ 
//     message: 'Server is running!',
//     timestamp: new Date().toISOString(),
//     database: isConnected ? 'Connected' : 'Disconnected'
//   });
// });

// // Create default user
// app.post('/api/create-default-user', async (req, res) => {
//   try {
//     const existingUser = await User.findOne({ username: 'admin' });
//     if (existingUser) {
//       return res.json({ 
//         message: 'Default user already exists',
//         username: 'admin',
//         password: 'admin123'
//       });
//     }

//     const hashedPassword = await bcrypt.hash('admin123', 10);
//     const user = new User({
//       username: 'admin',
//       password: hashedPassword
//     });

//     await user.save();
    
//     res.json({ 
//       message: 'Default user created successfully!',
//       username: 'admin',
//       password: 'admin123'
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       message: 'Error creating default user', 
//       error: error.message
//     });
//   }
// });

// // Login
// app.post('/api/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
    
//     if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required' });
//     }
    
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
    
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
    
//     const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
//     res.json({ 
//       message: 'Login successful',
//       token, 
//       user: { id: user._id, username: user.username } 
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Get location defaults
// app.get('/api/location-defaults/:location', (req, res) => {
//   try {
//     const { location } = req.params;
//     const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
    
//     res.json({
//       location,
//       ...defaults
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching location defaults', error: error.message });
//   }
// });

// // Get all location defaults
// app.get('/api/location-defaults', (req, res) => {
//   res.json(locationDefaults);
// });

// // Get bills by location
// app.get('/api/bills/:location', authenticateToken, async (req, res) => {
//   try {
//     const { location } = req.params;
    
//     if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
//       return res.status(400).json({ message: 'Valid location is required' });
//     }
    
//     const bills = await Bill.find({ location }).sort({ createdAt: -1 });
    
//     res.json({
//       location,
//       count: bills.length,
//       bills
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching bills', error: error.message });
//   }
// });

// // Create new bill
// app.post('/api/bills', authenticateToken, async (req, res) => {
//   try {
//     const { location, ...billData } = req.body;
    
//     if (!billData.billNumber || !billData.date) {
//       return res.status(400).json({ message: 'Bill number and date are required' });
//     }
    
//     if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
//       return res.status(400).json({ message: 'Valid location is required' });
//     }
    
//     const defaults = locationDefaults[location] || locationDefaults.Ratanagiri;
    
//     const completeBillData = {
//       ...defaults,
//       ...billData,
//       location,
//       createdBy: req.user.userId
//     };
    
//     const bill = new Bill(completeBillData);
//     await bill.save();
    
//     res.status(201).json({
//       message: 'Bill created successfully',
//       bill
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating bill', error: error.message });
//   }
// });

// // Update bill - ADD THIS ROUTE
// app.put('/api/bills/:billId', authenticateToken, async (req, res) => {
//   try {
//     const { billId } = req.params;
//     const { location, ...billData } = req.body;
    
//     if (!mongoose.Types.ObjectId.isValid(billId)) {
//       return res.status(400).json({ message: 'Invalid bill ID' });
//     }
    
//     if (!billData.billNumber || !billData.date) {
//       return res.status(400).json({ message: 'Bill number and date are required' });
//     }
    
//     if (!location || !['Ratanagiri', 'Singhururg'].includes(location)) {
//       return res.status(400).json({ message: 'Valid location is required' });
//     }
    
//     const bill = await Bill.findById(billId);
    
//     if (!bill) {
//       return res.status(404).json({ message: 'Bill not found' });
//     }
    
//     // Update bill with new data
//     const updatedBill = await Bill.findByIdAndUpdate(
//       billId,
//       {
//         ...billData,
//         location,
//         updatedAt: new Date()
//       },
//       { new: true, runValidators: true }
//     );
    
//     res.json({
//       message: 'Bill updated successfully',
//       bill: updatedBill
//     });
//   } catch (error) {
//     console.error('Error updating bill:', error);
//     res.status(500).json({ 
//       message: 'Error updating bill', 
//       error: error.message 
//     });
//   }
// });

// // Delete bill
// app.delete('/api/bills/:billId', authenticateToken, async (req, res) => {
//   try {
//     const { billId } = req.params;
    
//     if (!mongoose.Types.ObjectId.isValid(billId)) {
//       return res.status(400).json({ message: 'Invalid bill ID' });
//     }
    
//     const bill = await Bill.findById(billId);
    
//     if (!bill) {
//       return res.status(404).json({ message: 'Bill not found' });
//     }
    
//     await Bill.findByIdAndDelete(billId);
    
//     res.json({ 
//       message: 'Bill deleted successfully',
//       deletedBillId: billId
//     });
//   } catch (error) {
//     console.error('Error deleting bill:', error);
//     res.status(500).json({ 
//       message: 'Error deleting bill', 
//       error: error.message 
//     });
//   }
// });

// // Root endpoint
// app.get('/', (req, res) => {
//   res.json({ 
//     message: 'Billing System API is running on Vercel!',
//     timestamp: new Date().toISOString(),
//     endpoints: [
//       'GET /api/health',
//       'POST /api/create-default-user',
//       'POST /api/login',
//       'GET /api/location-defaults',
//       'GET /api/location-defaults/:location',
//       'GET /api/bills/:location',
//       'POST /api/bills',
//       'PUT /api/bills/:billId',
//       'DELETE /api/bills/:billId'
//     ]
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ 
//     message: 'Route not found',
//     path: req.originalUrl,
//     method: req.method
//   });
// });

// // Export for Vercel
// module.exports = app;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  },
  deliveryNote: String,
  modeOfPayment: String,
  dispatchedThrough: String,
  destination: String,
  dateRange: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Bill = mongoose.model('Bill', billSchema);

// Location defaults
const locationDefaults = {
  Ratanagiri: {
    supplier: {
      name: "Sanvi Trading company",
      address: "H-3 nancy cottage Sant Dnyaneshwar Road \n, Near Jain Mandir, Nancy Bus Depo \n, Borivali(East), Mumbai-400066",
      gstin: "27AJOPM9365R1ZX" 
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

// Utility function to convert number to words
function numberToWords(num) {
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  if (integerPart === 0 && decimalPart === 0) return 'Zero rupees only';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertBelowHundred = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  };

  const convertBelowThousand = (n) => {
    if (n === 0) return '';
    
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    
    let words = '';
    if (hundred > 0) {
      words += ones[hundred] + ' hundred';
    }
    if (remainder > 0) {
      if (hundred > 0) words += ' ';
      words += convertBelowHundred(remainder);
    }
    return words;
  };

  const convertNumber = (n) => {
    if (n === 0) return 'zero';

    let words = '';
    
    if (n >= 10000000) {
      const crores = Math.floor(n / 10000000);
      words += convertBelowThousand(crores) + ' crore ';
      n %= 10000000;
    }
    
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000);
      words += convertBelowThousand(lakhs) + ' lakh ';
      n %= 100000;
    }
    
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      words += convertBelowThousand(thousands) + ' thousand ';
      n %= 1000;
    }
    
    if (n > 0) {
      words += convertBelowThousand(n);
    }
    
    return words.trim();
  };

  let result = '';

  if (integerPart > 0) {
    result = convertNumber(integerPart) + ' rupees';
  }

  if (decimalPart > 0) {
    if (integerPart > 0) {
      result += ' and ';
    }
    result += convertNumber(decimalPart) + ' paise';
  }

  result += ' only';

  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Format date function
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate();
  const month = date.toLocaleString('en', { month: 'long' });
  const year = date.getFullYear();
  
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} ${month} ${year}`;
}

// Generate PDF function
const generatePDF = (billData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
      doc.moveDown();

      // Supplier and Invoice Details Table
      const tableTop = doc.y;
      
      // Supplier Info
      doc.fontSize(10).font('Helvetica')
        .text(billData.supplier.name, 50, tableTop)
        .text(`Invoice No.: ${billData.billNumber}`, 300, tableTop)
        .text(`Dated: ${formatDate(billData.date)}`, 300, tableTop + 15);
      
      doc.text(billData.supplier.address, 50, tableTop + 15, { width: 200 });
      if (billData.supplier.gstin) {
        doc.text(`GSTIN: ${billData.supplier.gstin}`, 50, tableTop + 45);
      }
      
      doc.text("Supplier's Ref.", 300, tableTop + 30)
        .text(`Mode/Terms of Payment: ${billData.modeOfPayment}`, 300, tableTop + 45);

      // Buyer Info
      const buyerTop = tableTop + 70;
      doc.text('Buyer', 50, buyerTop)
        .text("Buyer's Order No.", 300, buyerTop)
        .text(`Dated: ${billData.dateRange}`, 300, buyerTop + 15);
      
      doc.text(billData.buyer.name, 50, buyerTop + 15)
        .text(billData.buyer.address, 50, buyerTop + 30, { width: 200 })
        .text(`PAN: ${billData.buyer.pan}`, 50, buyerTop + 60);

      // Dispatch and Destination
      const dispatchTop = buyerTop + 80;
      doc.text(`Despatched through: Goods Vehicle${billData.dispatchedThrough ? ' - ' + billData.dispatchedThrough : ''}`, 300, dispatchTop)
        .text(`Destination: ${billData.destination}`, 300, dispatchTop + 15);

      // Items Table
      const itemsTop = dispatchTop + 40;
      doc.font('Helvetica-Bold')
        .text('Sl No.', 50, itemsTop)
        .text('Particulars', 80, itemsTop)
        .text('HSN/SAC', 200, itemsTop)
        .text('Quantity', 250, itemsTop)
        .text('Rate', 300, itemsTop)
        .text('per', 340, itemsTop)
        .text('Amount', 370, itemsTop);

      let currentY = itemsTop + 20;
      doc.font('Helvetica');
      
      billData.items.forEach((item, index) => {
        doc.text((index + 1).toString(), 50, currentY)
          .text(item.description, 80, currentY, { width: 110 })
          .text(item.hsnSac || '-', 200, currentY)
          .text(item.quantity.toString(), 250, currentY)
          .text(item.rate.toFixed(2), 300, currentY)
          .text(item.unit, 340, currentY)
          .text(`₹ ${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 370, currentY);
        
        currentY += 20;
      });

      // Totals
      const totalsTop = currentY + 10;
      doc.font('Helvetica-Bold')
        .text('Sub Total', 300, totalsTop)
        .text(`₹ ${billData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 370, totalsTop)
        .text('Invoice Total', 300, totalsTop + 40)
        .text(`₹ ${billData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} E & O.E`, 370, totalsTop + 40);

      // Amount in Words
      doc.font('Helvetica')
        .text('Amount Chargeable (in words)', 50, totalsTop + 70)
        .text(numberToWords(billData.totalAmount), 50, totalsTop + 85, { width: 500 });

      // Bank Details
      const bankTop = totalsTop + 120;
      doc.font('Helvetica-Bold')
        .text('Bank Details', 50, bankTop)
        .font('Helvetica')
        .text(`Bank Name: ${billData.bankDetails.name}`, 50, bankTop + 15)
        .text(`A/c No.: ${billData.bankDetails.accountNumber}`, 50, bankTop + 30)
        .text(`Branch: ${billData.bankDetails.branch}`, 50, bankTop + 45);
      
      if (billData.bankDetails.ifsc) {
        doc.text(`IFSC: ${billData.bankDetails.ifsc}`, 50, bankTop + 60);
      }
      
      doc.text(`for ${billData.buyer.name}`, 50, bankTop + 80);

      // Signatory
      doc.text('Authorised Signatory', 400, bankTop + 100)
        .text('This is a Computer Generated Invoice', 350, bankTop + 120, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
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

// Get single bill by ID
app.get('/api/bills/id/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bill', error: error.message });
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

// Update bill
app.put('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const billData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findByIdAndUpdate(
      id, 
      billData, 
      { new: true, runValidators: true }
    );
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json({
      message: 'Bill updated successfully',
      bill
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bill', error: error.message });
  }
});

// Generate PDF for bill
app.get('/api/bills/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const pdfBuffer = await generatePDF(bill.toObject());
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${bill.billNumber}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Generate PDF from bill data (without saving)
app.post('/api/generate-pdf', authenticateToken, async (req, res) => {
  try {
    const billData = req.body;
    
    if (!billData.billNumber || !billData.date) {
      return res.status(400).json({ message: 'Bill number and date are required' });
    }
    
    const pdfBuffer = await generatePDF(billData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${billData.billNumber}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Share bill via email (simulated - in production, integrate with email service)
app.post('/api/bills/:id/share/email', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // In a real implementation, you would:
    // 1. Generate PDF
    // 2. Send email with PDF attachment using Nodemailer, SendGrid, etc.
    // 3. Handle email delivery
    
    // For now, return success with download link
    res.json({
      message: 'Email sharing initiated',
      shareId: Date.now().toString(),
      downloadLink: `/api/bills/${id}/pdf`,
      bill: bill.billNumber,
      recipient: email
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error sharing bill via email', error: error.message });
  }
});

// Share bill via WhatsApp (simulated - returns shareable text)
app.post('/api/bills/:id/share/whatsapp', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const shareText = `Invoice ${bill.billNumber} - ${formatDate(bill.date)} - Total: ₹${bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    
    res.json({
      message: 'WhatsApp share text generated',
      shareText: shareText,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      bill: bill.billNumber
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error generating WhatsApp share', error: error.message });
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
      'GET /api/bills/id/:id',
      'POST /api/bills',
      'PUT /api/bills/:id',
      'GET /api/bills/:id/pdf',
      'POST /api/generate-pdf',
      'POST /api/bills/:id/share/email',
      'POST /api/bills/:id/share/whatsapp'
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : error.message
  });
});

// Export for Vercel
module.exports = app;
