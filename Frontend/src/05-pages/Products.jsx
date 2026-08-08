import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  ShoppingBag,
  Sparkles,
  X,
  MessageSquare,
  Search
} from 'lucide-react';
import axiosClient from '../01-api/axiosClient';
import { showNotification } from '../04-layout/MainLayout';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal togglers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    sku: '', 
    costPrice: '', 
    sellingPrice: '', 
    currentInventory: '', 
    description: '',
    minMarginPercent: 15,
    maxPriceIncreasePercent: 10,
    maxPriceDecreasePercent: 15
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [overridePrice, setOverridePrice] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState([]);

  const toggleExpandProduct = (productId) => {
    setExpandedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAutoDiscover = async (productId) => {
    setActionLoading(true);
    showNotification('AI Search Agent discovering competitor links online...', 'info');
    try {
      const res = await axiosClient.post(`/products/${productId}/discover`);
      showNotification(res.message || 'Competitor store discovery completed successfully!');
      fetchProducts(pagination.page);
    } catch (err) {
      showNotification(err.message || 'Auto-discovery failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchProducts = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/products?page=${pageNumber}&limit=8&search=${search}`);
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showNotification('Failed to load store catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axiosClient.post('/products', {
        ...newProduct,
        costPrice: parseFloat(newProduct.costPrice),
        sellingPrice: parseFloat(newProduct.sellingPrice),
        currentInventory: parseInt(newProduct.currentInventory) || 0,
        minMarginPercent: parseFloat(newProduct.minMarginPercent) || 15,
        maxPriceIncreasePercent: parseFloat(newProduct.maxPriceIncreasePercent) || 10,
        maxPriceDecreasePercent: parseFloat(newProduct.maxPriceDecreasePercent) || 15
      });
      setShowAddModal(false);
      setNewProduct({ 
        name: '', 
        sku: '', 
        costPrice: '', 
        sellingPrice: '', 
        currentInventory: '', 
        description: '',
        minMarginPercent: 15,
        maxPriceIncreasePercent: 10,
        maxPriceDecreasePercent: 15
      });
      showNotification('Product successfully added to catalog!');
      fetchProducts(pagination.page);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product? Competitor web trackers linked to this product will also be deleted.')) return;
    try {
      await axiosClient.delete(`/products/${id}`);
      showNotification('Product removed successfully');
      fetchProducts(pagination.page);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setOverrideError('');
    setActionLoading(true);
    
    const priceVal = parseFloat(overridePrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      setOverrideError('Please specify a valid selling price');
      setActionLoading(false);
      return;
    }
    
    try {
      await axiosClient.post('/pricing/override', {
        productId: selectedProduct._id,
        newPrice: priceVal,
        reason: overrideReason
      });
      setSelectedProduct(null);
      setOverridePrice('');
      setOverrideReason('');
      showNotification('Manual selling price override applied!');
      fetchProducts(pagination.page);
    } catch (err) {
      setOverrideError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition border border-indigo-600 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Table grid */}
      <div className="soft-card overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                <th className="p-5 pl-6">Product Code</th>
                <th className="p-5">Product Name</th>
                <th className="p-5">Cost Price</th>
                <th className="p-5">Selling Price</th>
                <th className="p-5">Profit Margin</th>
                <th className="p-5">Stock Level</th>
                <th className="p-5">Active Badges</th>
                <th className="p-5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-xs">
              
              {/* Skeleton Loaders */}
              {loading ? (
                [1, 2, 3, 4].map(n => (
                  <tr key={n}>
                    <td className="p-5 pl-6"><div className="h-4 w-16 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-40 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-12 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-12 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-10 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-16 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-20 skeleton rounded" /></td>
                    <td className="p-5 pr-6 text-right"><div className="h-8 w-16 skeleton rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                        <Package className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Your Catalog is Empty</h4>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        You haven't configured any products in your catalog yet. Click the "Add Product" button to start.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const marginPercent = (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0);
                  
                  return (
                    <React.Fragment key={p._id}>
                      <tr className="hover:bg-slate-55/20 transition duration-150">
                        <td className="p-5 pl-6 font-mono text-[10px] text-indigo-500 font-bold">{p.sku}</td>
                        <td className="p-5 font-bold text-slate-800">{p.name}</td>
                        <td className="p-5 font-mono text-slate-500 font-medium">${p.costPrice.toFixed(2)}</td>
                        <td className="p-5 font-mono font-bold text-slate-800">${p.sellingPrice.toFixed(2)}</td>
                         <td className="p-5">
                          <span className={`inline-block whitespace-nowrap text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${marginPercent >= 20 ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'}`}>
                            {marginPercent}% Margin
                          </span>
                        </td>
                        <td className="p-5 font-mono text-slate-500 whitespace-nowrap">{p.currentInventory} units</td>
                        <td className="p-5">
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {p.badges.map((b, idx) => (
                              <span key={idx} className="whitespace-nowrap text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-100 text-indigo-600 bg-indigo-50/50 uppercase tracking-wider">
                                {b}
                              </span>
                            ))}
                            {p.badges.length === 0 && <span className="text-slate-400 font-medium text-[10px] italic">None</span>}
                          </div>
                        </td>
                        <td className="p-5 pr-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => toggleExpandProduct(p._id)}
                              className={`p-2 border rounded-xl transition duration-150 ${expandedProductIds.includes(p._id) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-105 text-slate-600'}`}
                              title="View Market Sentiment & Reviews Summary"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAutoDiscover(p._id)}
                              disabled={actionLoading}
                              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-indigo-600 hover:border-indigo-100 rounded-xl transition duration-150"
                              title="Auto-Discover Competitor Links"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedProduct(p)}
                              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition duration-150"
                              title="Override Selling Price"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id)}
                              className="p-2 bg-slate-50 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition duration-150"
                              title="Remove Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedProductIds.includes(p._id) && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="8" className="p-4 pl-6 pr-6">
                            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col space-y-4 animate-in fade-in duration-250">
                              {p.sentiment ? (
                                <div className="space-y-2 text-left">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${p.sentiment.sentimentScore >= 0.25 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : p.sentiment.sentimentScore <= -0.25 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                                      Sentiment: {p.sentiment.sentimentScore > 0 ? `+${p.sentiment.sentimentScore}` : p.sentiment.sentimentScore} Hype
                                    </span>
                                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 uppercase tracking-wider">
                                      Demand level: {p.sentiment.demandScore}/10
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">AI Reviews Sentiment Analysis</span>
                                  <p className="text-slate-600 text-xs leading-relaxed max-w-4xl">{p.sentiment.trendSummary}</p>
                                  
                                  {p.badges.includes("Chameleon Optimized") && (
                                    <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
                                      <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">AI Chameleon Listing Active</span>
                                      <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl text-xs space-y-1 text-slate-600">
                                        <p><strong>Title:</strong> {p.name}</p>
                                        <p><strong>Description:</strong> {p.description}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="py-2 text-slate-400 text-xs flex items-center space-x-2">
                                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span>No reviews data found. Click "Optimize Prices Now" on the dashboard to scrape forums and run sentiment analyzers.</span>
                                </div>
                              )}

                              {p.competitors && p.competitors.length > 0 && (
                                <div className="border-t border-slate-100 pt-4 w-full text-left">
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">Discovered Store Price Comparison</span>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {p.competitors.map((comp) => {
                                      const diff = comp.lastScrapedPrice ? (p.sellingPrice - comp.lastScrapedPrice) : null;
                                      const diffPercent = diff && comp.lastScrapedPrice ? ((diff / comp.lastScrapedPrice) * 100).toFixed(0) : null;
                                      
                                      return (
                                        <div key={comp._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                          <div className="min-w-0 flex-1 pr-2">
                                            <span className="text-[10px] font-bold text-slate-800 block truncate">{comp.name}</span>
                                            <span className="text-[9px] text-slate-400 block truncate">{comp.url}</span>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="text-xs font-mono font-bold text-slate-800 block">
                                              {comp.lastScrapedPrice ? `$${comp.lastScrapedPrice.toFixed(2)}` : 'Pending'}
                                            </span>
                                            {diff !== null && (
                                              <span className={`text-[9px] font-extrabold block mt-0.5 ${diff < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {diff < 0 ? `${Math.abs(diffPercent)}% Cheaper` : `${diffPercent}% Costly`}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchProducts(pagination.page - 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchProducts(pagination.page + 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Override Pricing */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Manual Price Adjuster</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Bypass dynamic algorithms for Code: {selectedProduct.sku}</p>
              </div>
              <button onClick={() => { setSelectedProduct(null); setOverrideError(''); }} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4">
              {overrideError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[10px] leading-normal font-semibold flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Something went wrong: {overrideError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Wholesale Cost</span>
                  <span className="text-xs font-mono font-bold text-slate-700 mt-0.5 block">${selectedProduct.costPrice.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Price</span>
                  <span className="text-xs font-mono font-bold text-slate-700 mt-0.5 block">${selectedProduct.sellingPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Selling Price ($)</label>
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                    <div className="hidden group-hover:block absolute bottom-6 left-0 bg-slate-900 text-white text-[9px] p-2 rounded-lg w-48 leading-normal shadow-md font-medium z-50">
                      Cost Price Protection is active. You cannot set a price lower than your baseline cost of ${selectedProduct.costPrice}.
                    </div>
                  </div>
                </div>
                
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4.25"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason / Motivation</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Why are you changing this price? (e.g., matching local store discount...)"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setSelectedProduct(null); setOverrideError(''); }}
                  className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs btn-animate"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs border border-indigo-600 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
                >
                  Apply Adjusted Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Add Catalog Product</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unibic Sugar Free Cashew Cookies"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 font-sans">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Code (SKU)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UNIBIC-SF-CASHEW"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory Stock</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={newProduct.currentInventory}
                    onChange={(e) => setNewProduct({ ...newProduct, currentInventory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2.50"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[8px] text-slate-400 leading-none mt-0.5 block">Baseline wholesale cost. AI protects this.</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 3.99"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Details (Description)</label>
                <textarea
                  rows="2"
                  placeholder="Details about product size, packaging..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Deterministic Margin Guardrails</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Min Margin %</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.minMarginPercent}
                      onChange={(e) => setNewProduct({ ...newProduct, minMarginPercent: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max Spike %</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.maxPriceIncreasePercent}
                      onChange={(e) => setNewProduct({ ...newProduct, maxPriceIncreasePercent: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max Drop %</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.maxPriceDecreasePercent}
                      onChange={(e) => setNewProduct({ ...newProduct, maxPriceDecreasePercent: e.target.value })}
                      className="w-full bg-slate-55 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs btn-animate"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs border border-indigo-600 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
                >
                  Confirm Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
