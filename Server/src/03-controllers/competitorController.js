const Competitor = require('../02-models/Competitor');
const Product = require('../02-models/Product');

const getCompetitors = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.productId) {
      query.product = req.query.productId;
    }
    const competitors = await Competitor.find(query).populate('product');
    return res.json({ success: true, data: competitors });
  } catch (error) {
    next(error);
  }
};

const createCompetitor = async (req, res, next) => {
  try {
    const { productId, name, url, selectorPrice, selectorStock } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product parent not found' });
    }
    
    const competitor = new Competitor({
      product: productId,
      name,
      url,
      selectorPrice,
      selectorStock
    });
    
    const saved = await competitor.save();
    
    // Add competitor link reference in Product model
    product.competitors.push(saved._id);
    await product.save();
    
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

const updateCompetitor = async (req, res, next) => {
  try {
    const competitor = await Competitor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!competitor) {
      return res.status(404).json({ success: false, message: 'Competitor entry not found' });
    }
    return res.json({ success: true, data: competitor });
  } catch (error) {
    next(error);
  }
};

const deleteCompetitor = async (req, res, next) => {
  try {
    const competitor = await Competitor.findById(req.params.id);
    if (!competitor) {
      return res.status(404).json({ success: false, message: 'Competitor entry not found' });
    }
    
    // Remove competitor linkage from the Product model
    await Product.findByIdAndUpdate(competitor.product, {
      $pull: { competitors: competitor._id }
    });
    
    await competitor.deleteOne();
    return res.json({ success: true, message: 'Competitor config deleted and unlinked from product' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompetitors,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor
};
