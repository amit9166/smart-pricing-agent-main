const mongoose = require('mongoose');

const CompetitorSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  selectorPrice: {
    type: String,
    default: ''
  },
  selectorStock: {
    type: String,
    default: ''
  },
  lastScrapedPrice: {
    type: Number,
    default: null
  },
  lastScrapedStock: {
    type: String,
    default: 'In Stock'
  },
  lastScrapedRating: {
    type: Number,
    default: null
  },
  lastScrapedDiscount: {
    type: Number,
    default: 0
  },
  lastScrapedAt: {
    type: Date,
    default: null
  },
  history: [{
    price: Number,
    scrapedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Competitor', CompetitorSchema);
