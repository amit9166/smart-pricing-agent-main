const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentInventory: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  tags: {
    type: [String],
    default: []
  },
  badges: {
    type: [String],
    default: []
  },
  competitors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competitor'
  }],
  minMarginPercent: {
    type: Number,
    default: 15,
    min: 0
  },
  maxPriceIncreasePercent: {
    type: Number,
    default: 10,
    min: 0
  },
  maxPriceDecreasePercent: {
    type: Number,
    default: 15,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
