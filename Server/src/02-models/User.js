const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'viewer'],
    default: 'admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
