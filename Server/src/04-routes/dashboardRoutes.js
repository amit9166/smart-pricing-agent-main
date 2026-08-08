const express = require('express');
const router = express.Router();
const { getSummaryStats, getChartsData } = require('../03-controllers/dashboardController');

router.get('/stats', getSummaryStats);
router.get('/charts', getChartsData);

module.exports = router;
