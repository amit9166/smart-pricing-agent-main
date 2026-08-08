import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Users, 
  CheckSquare, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import axiosClient from '../01-api/axiosClient';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        axiosClient.get('/dashboard/stats'),
        axiosClient.get('/dashboard/charts')
      ]);
      setStats(statsRes.data);
      setChartsData(chartsRes.data);
      setError(null);
    } catch (err) {
      setError('Unable to reach backend servers. Verify database and container links.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="soft-card p-6 h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="soft-card p-6 h-96 skeleton rounded-2xl" />
          <div className="soft-card p-6 h-96 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="soft-card p-8 border-rose-100 max-w-xl mx-auto my-12 text-center bg-white">
        <TrendingDown className="w-10 h-10 text-rose-500 mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-800 mb-1">Server Connection Offline</h3>
        <p className="text-slate-400 text-xs mb-6 leading-relaxed">{error}</p>
        <button onClick={fetchData} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs btn-animate">
          Retry Connection
        </button>
      </div>
    );
  }

  const statCards = [
    { name: 'Products in Catalog', value: stats?.products || 0, icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', desc: 'Total items configured' },
    { name: 'Competitors Mapped', value: stats?.competitors || 0, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100', desc: 'Tracked URLs' },
    { name: 'Price Adjustments', value: stats?.priceChanges || 0, icon: CheckSquare, color: 'text-amber-600 bg-amber-50 border-amber-100', desc: 'AI & manual changes' },
    { name: 'Average Market Hype', value: stats?.avgSentiment !== undefined ? `${(stats.avgSentiment * 100).toFixed(0)}%` : '0%', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', desc: 'Reddit & Reviews sentiment' }
  ];

  // Price history timeline formatting
  const formattedLineData = (chartsData?.priceHistory || [])
    .map(h => ({
      name: new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
      price: h.newPrice,
      sku: h.product?.sku || 'Item'
    }))
    .reverse();

  // Competitor pricing formatting
  const formattedBarData = (chartsData?.competitorComparison || []).map(p => ({
    name: p.productName.length > 15 ? `${p.productName.slice(0, 15)}...` : p.productName,
    'Our Price ($)': p.sellingPrice,
    'Cost Price ($)': p.costPrice,
    'Competitor Min ($)': p.minCompetitorPrice || p.sellingPrice
  }));

  return (
    <div className="space-y-6">
      
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="soft-card p-6 flex items-center justify-between bg-white">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{card.value}</h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-1.5">{card.desc}</span>
              </div>
              <div className={`p-3.5 rounded-2xl border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pricing Updates Line Chart */}
        <div className="soft-card p-6 flex flex-col h-96 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Dynamic Price Updates</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Timeline of dynamic price optimization runs</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-h-0">
            {formattedLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-semibold">No price changes logged yet</span>
                <span className="text-[10px] text-slate-400">Trigger the pricing agent loop to generate updates.</span>
              </div>
            )}
          </div>
        </div>

        {/* Competitor Price Comparison Bar Chart */}
        <div className="soft-card p-6 flex flex-col h-96 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Your Price vs. Competitors</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Comparison with competitor minimums and baseline cost price</p>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-h-0">
            {formattedBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                  <Bar dataKey="Cost Price ($)" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Our Price ($)" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Competitor Min ($)" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-semibold">No pricing comparisons available</span>
                <span className="text-[10px] text-slate-400">Configure a competitor target under the Competitors Tracker.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity timeline feed */}
      <div className="soft-card p-6 bg-white shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span>Recent Price Adjustments Ledger</span>
        </h3>
        
        <div className="space-y-4">
          {(chartsData?.priceHistory || []).slice(0, 3).map((history, index) => {
            const difference = (history.newPrice - history.oldPrice).toFixed(2);
            const isUp = history.newPrice > history.oldPrice;
            
            return (
              <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl border ${isUp ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{history.product?.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Rule Applied: <span className="font-semibold text-slate-500">{history.ruleApplied}</span>
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 block">${history.newPrice.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold block mt-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? '+' : ''}{difference} ({(((history.newPrice - history.oldPrice) / history.oldPrice) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
          
          {(chartsData?.priceHistory || []).length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
              No recent adjustments recorded yet. Complete the getting started wizard to begin!
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
