const Product = require('../02-models/Product');
const PriceHistory = require('../02-models/PriceHistory');
const AgentLog = require('../02-models/AgentLog');
const fastApiClient = require('../06-services/fastApiClient');
const slackService = require('../06-services/slackService');

const runPricingAgent = async (req, res, next) => {
  try {
    const { productId } = req.body;
    console.log(`[Pricing Controller] Triggering pricing agent. ProductId: ${productId || 'ALL'}`);
    
    // Call FastAPI agent service asynchronously or synchronously
    // We do it asynchronously to avoid blockages, returning a runId
    const result = await fastApiClient.runAgent(productId);
    return res.json({ success: true, message: 'Pricing agent loop initialized', data: result });
  } catch (error) {
    next(error);
  }
};

const manualOverridePrice = async (req, res, next) => {
  try {
    const { productId, newPrice, reason } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Safety verification check: Cannot price below cost
    if (newPrice < product.costPrice) {
      return res.status(400).json({
        success: false,
        message: `Override rejected: New price ($${newPrice}) is below cost price ($${product.costPrice})`
      });
    }
    
    const oldPrice = product.sellingPrice;
    product.sellingPrice = newPrice;
    
    // Update tags/badges to indicate manual override state
    if (!product.badges.includes('Manual Override')) {
      product.badges.push('Manual Override');
    }
    
    await product.save();
    
    // Save history
    const historyEntry = new PriceHistory({
      product: productId,
      oldPrice,
      newPrice,
      reason: reason || 'Manual user override via dashboard',
      confidence: 1.0,
      agentDecision: false,
      ruleApplied: 'Manual Override'
    });
    await historyEntry.save();
    
    // Send Slack Alert
    await slackService.sendPriceAlert(
      product.name,
      product.sku,
      oldPrice,
      newPrice,
      reason || 'Manual user override via dashboard',
      1.0,
      'Manual Override'
    );
    
    // Log agent action log
    const adminLog = new AgentLog({
      runId: `manual-override-${Date.now()}`,
      product: productId,
      agentName: 'Manual Override',
      status: 'success',
      message: `User manually modified product price from $${oldPrice} to $${newPrice}`,
      payload: { oldPrice, newPrice, reason }
    });
    await adminLog.save();
    
    return res.json({ success: true, message: 'Price updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

const getAgentLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skipIndex = (page - 1) * limit;
    
    const total = await AgentLog.countDocuments();
    const logs = await AgentLog.find()
      .populate('product', 'name sku')
      .skip(skipIndex)
      .limit(limit)
      .sort({ timestamp: -1 });
      
    return res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getVectorMemory = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const memory = await fastApiClient.getMemory(productId);
    return res.json({ success: true, data: memory });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runPricingAgent,
  manualOverridePrice,
  getAgentLogs,
  getVectorMemory
};
