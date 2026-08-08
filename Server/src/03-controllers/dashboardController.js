const Product = require('../02-models/Product');
const Competitor = require('../02-models/Competitor');
const PriceHistory = require('../02-models/PriceHistory');
const Sentiment = require('../02-models/Sentiment');
const AgentLog = require('../02-models/AgentLog');
const fastApiClient = require('../06-services/fastApiClient');

const getSummaryStats = async (req, res, next) => {
  try {
    const productCount = await Product.countDocuments({ status: 'active' });
    const competitorCount = await Competitor.countDocuments();
    const priceChangeCount = await PriceHistory.countDocuments();
    
    // Average confidence metric
    const avgConfidenceResult = await PriceHistory.aggregate([
      { $group: { _id: null, avgConf: { $avg: '$confidence' } } }
    ]);
    const avgConfidence = avgConfidenceResult[0] ? avgConfidenceResult[0].avgConf : 1.0;
    
    // Sentiment aggregated values
    const sentiments = await Sentiment.find();
    const avgSentiment = sentiments.length > 0 
      ? sentiments.reduce((acc, curr) => acc + curr.sentimentScore, 0) / sentiments.length
      : 0;
      
    const avgDemand = sentiments.length > 0
      ? sentiments.reduce((acc, curr) => acc + curr.demandScore, 0) / sentiments.length
      : 5;

    // Call FastAPI agent status
    const pythonStatus = await fastApiClient.getAgentStatus();
    
    return res.json({
      success: true,
      data: {
        products: productCount,
        competitors: competitorCount,
        priceChanges: priceChangeCount,
        avgConfidence: parseFloat(avgConfidence.toFixed(2)),
        avgSentiment: parseFloat(avgSentiment.toFixed(2)),
        avgDemand: parseFloat(avgDemand.toFixed(1)),
        agentServiceStatus: pythonStatus.status || 'offline'
      }
    });
  } catch (error) {
    next(error);
  }
};

const getChartsData = async (req, res, next) => {
  try {
    // 1. Get recent price changes
    const priceHistory = await PriceHistory.find()
      .populate('product', 'name sku')
      .sort({ timestamp: -1 })
      .limit(30);

    // 2. Competitor comparison data: average product prices vs competitor prices
    const products = await Product.find({ status: 'active' }).populate('competitors');
    const competitorComparison = products.map(p => {
      const competitorPrices = p.competitors
        .filter(c => c.lastScrapedPrice !== null)
        .map(c => ({ name: c.name, price: c.lastScrapedPrice }));
        
      const minCompetitorPrice = competitorPrices.length > 0 
        ? Math.min(...competitorPrices.map(c => c.price))
        : null;
        
      const maxCompetitorPrice = competitorPrices.length > 0 
        ? Math.max(...competitorPrices.map(c => c.price))
        : null;

      return {
        productName: p.name,
        sku: p.sku,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        minCompetitorPrice,
        maxCompetitorPrice,
        competitorsCount: competitorPrices.length
      };
    });

    // 3. Sentiment breakdown distribution
    const sentiments = await Sentiment.find().populate('product', 'name');
    const sentimentSummary = sentiments.map(s => ({
      name: s.product ? s.product.name : 'Unknown Product',
      sentimentScore: s.sentimentScore,
      demandScore: s.demandScore
    }));

    return res.json({
      success: true,
      data: {
        priceHistory,
        competitorComparison,
        sentimentSummary
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummaryStats,
  getChartsData
};
