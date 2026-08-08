import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, ExternalLink, Info, X } from 'lucide-react';
import axiosClient from '../01-api/axiosClient';
import { showNotification } from '../04-layout/MainLayout';

const Competitors = () => {
  const [competitors, setCompetitors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ productId: '', name: '', url: '', selectorPrice: '', selectorStock: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, prodRes] = await Promise.all([
        axiosClient.get('/competitors'),
        axiosClient.get('/products?limit=100')
      ]);
      setCompetitors(compRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      showNotification('Failed to fetch competitor catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCompetitor = async (e) => {
    e.preventDefault();
    if (!newCompetitor.productId) {
      showNotification('Please select a catalog item first', 'info');
      return;
    }
    setActionLoading(true);
    try {
      await axiosClient.post('/competitors', newCompetitor);
      setShowAddModal(false);
      setNewCompetitor({ productId: '', name: '', url: '', selectorPrice: '', selectorStock: '' });
      showNotification('Competitor link tracked successfully!');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompetitor = async (id) => {
    if (!window.confirm('Stop monitoring this competitor website?')) return;
    try {
      await axiosClient.delete(`/competitors/${id}`);
      showNotification('Competitor link removed');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Actions Bar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition border border-indigo-600 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Monitor Competitor</span>
        </button>
      </div>

      {/* Competitors List Table */}
      <div className="soft-card overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                <th className="p-5 pl-6">Competitor Shop</th>
                <th className="p-5">Linked Product</th>
                <th className="p-5">Product Page Link</th>
                <th className="p-5">Last Scraped Price</th>
                <th className="p-5">Stock Status</th>
                <th className="p-5">Last Scraped Time</th>
                <th className="p-5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-xs">
              
              {/* Skeleton loading states */}
              {loading ? (
                [1, 2, 3].map(n => (
                  <tr key={n}>
                    <td className="p-5 pl-6"><div className="h-4 w-24 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-40 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-48 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-12 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-16 skeleton rounded" /></td>
                    <td className="p-5"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="p-5 pr-6 text-right"><div className="h-8 w-16 skeleton rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : competitors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                        <Globe className="w-8 h-8 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">No Competitors Monitored</h4>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        You haven't configured any competitor links yet. Click "Monitor Competitor" to start tracking prices across other stores.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                competitors.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-55/20 transition duration-150">
                    <td className="p-5 pl-6 font-bold text-slate-800 flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <span>{c.name}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{c.product?.name || 'Unknown'}</span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">{c.product?.sku || ''}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 hover:underline max-w-xs truncate font-medium text-xs"
                      >
                        <span className="truncate">{c.url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </td>
                    <td className="p-5 font-mono font-bold text-slate-800">
                      {c.lastScrapedPrice !== null ? `$${c.lastScrapedPrice.toFixed(2)}` : (
                        <span className="text-slate-400 text-[10px] font-semibold italic">Pending...</span>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`inline-block whitespace-nowrap text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${c.lastScrapedStock === 'In Stock' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'}`}>
                        {c.lastScrapedStock}
                      </span>
                    </td>
                    <td className="p-5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {c.lastScrapedAt ? new Date(c.lastScrapedAt).toLocaleString() : '-'}
                    </td>
                    <td className="p-5 pr-6 text-right">
                      <button
                        onClick={() => handleDeleteCompetitor(c._id)}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition duration-150"
                        title="Stop tracking link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add Competitor */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Monitor Competitor Store</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompetitor} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Catalog Item</label>
                <select
                  required
                  value={newCompetitor.productId}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose product catalog item --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Competitor Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon, Walmart, Target"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Competitor Product URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example-competitor.com/product-link"
                  value={newCompetitor.url}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price Location Tag</label>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      <div className="hidden group-hover:block absolute bottom-6 left-0 bg-slate-900 text-white text-[9px] p-2 rounded-lg w-40 leading-normal shadow-md font-medium z-50">
                        Leave blank to let AI auto-detect. Or enter CSS class like `.price-value`.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. .a-price-whole"
                    value={newCompetitor.selectorPrice}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, selectorPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Location Tag</label>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      <div className="hidden group-hover:block absolute bottom-6 left-0 bg-slate-900 text-white text-[9px] p-2 rounded-lg w-40 leading-normal shadow-md font-medium z-50">
                        Leave blank to let AI auto-detect. Or enter CSS ID like `#out-of-stock`.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. #availability-status"
                    value={newCompetitor.selectorStock}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, selectorStock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
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
                  Confirm Monitor link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Competitors;
