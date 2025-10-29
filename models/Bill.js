const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    trim: true
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
      address: "H-3 nancy cottage Sant Dnyaneshwar Road \n Near Jain Mandir,Nancy Bus Depo \n Borivali(East) , Mumbai-400066",
      GSTIN :"27AJOPM9365R1ZX" 
    },
    buyer: {
      name: "Jay Ganesh Transport  " ,
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
      name: "PARSHWANATH TRADERS ",
      address: "RAJMATA COMPLEX, PARLI, PARLI-V, Beed. Maharasthra 431515 ",
      gstin: ""
    },
    buyer: {
      name: "A.R.Trading Company ",
      address: "Shahu Market Yard, Kolhapur - 416005",
      pan: "AQRPJ6441R "
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

module.exports = { Bill, User, locationDefaults };
