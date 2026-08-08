const express = require('express');
const router = express.Router();
const {
  runPricingAgent,
  manualOverridePrice,
  getAgentLogs,
  getVectorMemory
} = require('../03-controllers/pricingController');

router.post('/run', runPricingAgent);
router.post('/override', manualOverridePrice);
router.get('/logs', getAgentLogs);
router.get('/memory', getVectorMemory);

module.exports = router;
