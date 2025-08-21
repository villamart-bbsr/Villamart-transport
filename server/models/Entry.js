const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true
  },
  distributor: {
    type: String,
    required: true,
    enum: ['Blinkit', 'Instamart', 'Zepto', 'BigBasket']
  },
  inOut: {
    type: String,
    required: true,
    enum: ['In', 'Out']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  barcodes: [{
    type: String,
    required: true
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Entry', EntrySchema);
