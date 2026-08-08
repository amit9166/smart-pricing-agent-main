const Product = require('../02-models/Product');
const Competitor = require('../02-models/Competitor');
const Sentiment = require('../02-models/Sentiment');
const fastApiClient = require('../06-services/fastApiClient');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skipIndex = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('competitors')
      .skip(skipIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    // Fetch and merge sentiment analytics for the products list
    const productIds = products.map(p => p._id);
    const sentiments = await Sentiment.find({ product: { $in: productIds } });
    
    const dataWithSentiment = products.map(p => {
      const sentiment = sentiments.find(s => s.product.toString() === p._id.toString());
      const pDoc = p.toObject();
      pDoc.sentiment = sentiment || null;
      return pDoc;
    });
      
    return res.json({
      success: true,
      data: dataWithSentiment,
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

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('competitors');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const sentiment = await Sentiment.findOne({ product: req.params.id });
    const productDoc = product.toObject();
    productDoc.sentiment = sentiment || null;
    
    return res.json({ success: true, data: productDoc });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { 
      name, 
      sku, 
      description, 
      costPrice, 
      sellingPrice, 
      currentInventory, 
      tags, 
      badges, 
      minMarginPercent, 
      maxPriceIncreasePercent, 
      maxPriceDecreasePercent 
    } = req.body;
    const existing = await Product.findOne({ sku });
    if (existing) {
      return res.status(400).json({ success: false, message: `Product with SKU ${sku} already exists` });
    }
    
    const product = new Product({
      name,
      sku,
      description,
      costPrice,
      sellingPrice,
      currentInventory,
      tags,
      badges,
      minMarginPercent: minMarginPercent !== undefined ? parseFloat(minMarginPercent) : 15,
      maxPriceIncreasePercent: maxPriceIncreasePercent !== undefined ? parseFloat(maxPriceIncreasePercent) : 10,
      maxPriceDecreasePercent: maxPriceDecreasePercent !== undefined ? parseFloat(maxPriceDecreasePercent) : 15
    });
    
    await product.save();
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Remove all associated competitor linkages
    await Competitor.deleteMany({ product: req.params.id });
    await product.deleteOne();
    
    return res.json({ success: true, message: 'Product and associated competitor links deleted' });
  } catch (error) {
    next(error);
  }
};

const discoverCompetitors = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Trigger Python Auto-Discovery Agent
    const result = await fastApiClient.discoverCompetitors(productId);
    const discoveredStores = result.discovered || [];
    
    const addedCompetitors = [];
    let skippedCount = 0;
    
    for (const store of discoveredStores) {
      // Check if store link already exists to prevent duplicate addition
      const exists = await Competitor.findOne({ product: productId, url: store.url });
      if (!exists) {
        const competitor = new Competitor({
          product: productId,
          name: store.name,
          url: store.url,
          selectorPrice: store.selectorPrice || '.price',
          selectorStock: ''
        });
        await competitor.save();
        product.competitors.push(competitor._id);
        addedCompetitors.push(competitor);
      } else {
        skippedCount++;
      }
    }
    
    await product.save();
    
    let message = '';
    if (addedCompetitors.length > 0) {
      message = `Configured ${addedCompetitors.length} new competitor stores.`;
      if (skippedCount > 0) {
        message += ` (Skipped ${skippedCount} duplicate links)`;
      }
    } else {
      message = `All discovered stores (${skippedCount}) are already tracked for this product.`;
    }
    
    return res.json({
      success: true,
      message,
      competitors: addedCompetitors
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  discoverCompetitors
};
