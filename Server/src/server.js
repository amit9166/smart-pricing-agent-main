const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config();

const connectDB = require('./01-config/db');
const { initScheduler } = require('./06-services/scheduler');
const errorHandler = require('./05-middlewares/errorHandler');

const productRoutes = require('./04-routes/productRoutes');
const competitorRoutes = require('./04-routes/competitorRoutes');
const pricingRoutes = require('./04-routes/pricingRoutes');
const dashboardRoutes = require('./04-routes/dashboardRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount Router Paths
app.use('/api/products', productRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root path test route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Fallback 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// Global Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Establish MongoDB connection
  await connectDB();
  
  // 2. Initialize Scheduler Service (Periodically triggers dynamic pricing updates)
  initScheduler();

  // 3. Listen on HTTP port
  app.listen(PORT, () => {
    console.log(`[Express Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
