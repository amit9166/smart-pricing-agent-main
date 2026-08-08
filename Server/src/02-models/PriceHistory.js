const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  oldPrice: {
    type: Number,
    required: true
  },
  newPrice: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0
  },
  agentDecision: {
    type: Boolean,
    default: true
  },
  ruleApplied: {
    type: String,
    default: 'Manual'
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);
