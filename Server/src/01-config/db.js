const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/competitive_pricing';
    await mongoose.connect(connURI);
    console.log(`[Database] MongoDB Connected to: ${connURI}`);
  } catch (error) {
    console.error(`[Database] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
