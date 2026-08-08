const mongoose = require('mongoose');

const AgentLogSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  agentName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'success', 'failed', 'info'],
    default: 'info'
  },
  message: {
    type: String,
    default: ''
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

module.exports = mongoose.model('AgentLog', AgentLogSchema);
