const mongoose = require('mongoose');

const SentimentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  demandScore: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  sentimentScore: {
    type: Number,
    required: true,
    min: -1,
    max: 1,
    default: 0
  },
  positiveSentimentCount: {
    type: Number,
    default: 0
  },
  negativeSentimentCount: {
    type: Number,
    default: 0
  },
  trendSummary: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'Reddit / Reviews'
  }
}, {
  timestamps: { createdAt: false, updatedAt: 'lastUpdated' }
});

module.exports = mongoose.model('Sentiment', SentimentSchema);
