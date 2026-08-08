import React, { useState } from 'react';
import { 
  Search, 
  Database, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Play,
  RotateCcw,
  Workflow
} from 'lucide-react';
import axiosClient from '../01-api/axiosClient';

const AgentStatus = () => {
  const [query, setQuery] = useState('');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);

  const handleSearchMemory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.get(`/pricing/memory?productId=${query}`);
      setMemories(res.data || []);
      setQueried(true);
    } catch (err) {
      console.error(err);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const agentNodes = [
    { name: '1. Price Scraper', desc: 'Checks competitor links to see if they updated their catalog pricing.', tool: 'Playwright Browser' },
    { name: '2. Buzz Tracker', desc: 'Queries social comments and reviews to evaluate customer demand hype.', tool: 'Gemini sentiment API' },
    { name: '3. Memory Retrieval', desc: 'Recalls similar historical scenarios from the pricing vector database.', tool: 'ChromaDB Memory' },
    { name: '4. Price Optimizer', desc: 'Calculates the best selling price and protects margins using dynamic formulas.', tool: 'Gemini & Safety rules' },
    { name: '5. Catalog Sync', desc: 'Updates your store pricing database and sends dynamic tags or badges.', tool: 'Catalog Sync Engine' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Step-by-Step pricing wizard */}
      <div className="soft-card p-6 bg-white shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <Workflow className="w-4.5 h-4.5 text-indigo-500" />
          <span>How Your AI Pricing Brain Works</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative items-center">
          {agentNodes.map((node, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 hover:border-indigo-200 hover:bg-indigo-50/5 transition duration-200 flex flex-col justify-between h-44">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono">STEP 0{idx + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-online-pulse" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs">{node.name}</h4>
                  <p className="text-slate-500 text-[10px] mt-1.5 leading-normal font-medium">{node.desc}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[9px] text-slate-400 font-medium">
                  Tech: <span className="font-bold text-slate-500 font-mono">{node.tool}</span>
                </div>
              </div>
              
              {idx < 4 && (
                <div className="hidden lg:flex justify-center text-slate-300 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ChromaDB Vector memory search tool */}
      <div className="soft-card p-6 bg-white shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Database className="w-4.5 h-4.5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Search Your Pricing Memory</h3>
        </div>
        <p className="text-xs text-slate-400 leading-normal max-w-2xl font-medium mb-6">
          Type keywords (such as product code, SKU, or search tags) to see what past price adjustments and optimization runs the AI remembers.
        </p>

        <form onSubmit={handleSearchMemory} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Type search term (e.g. UNIBIC-SF-CASHEW)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
          
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition border border-indigo-600 shadow-[0_2px_12px_rgba(99,102,241,0.2)]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Memory</span>
          </button>
        </form>

        {/* Vector memories outcomes listing */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              Querying AI memories...
            </div>
          ) : memories.length === 0 && queried ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No matching pricing memory cases found. Try searching for a product SKU.
            </div>
          ) : memories.length === 0 && !queried ? (
            <div className="py-8 text-center text-slate-400 text-[10px] font-semibold italic">
              Search results will show here. Try searching for a product code!
            </div>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono">Memory ID: {m.id.split('-').slice(0,2).join('-')}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">Code: {m.metadata?.sku}</span>
                  </div>
                  <p className="text-slate-600 text-xs font-semibold mt-1">{m.document}</p>
                </div>
                
                <div className="shrink-0 flex items-center space-x-4 border-l border-slate-200 pl-4">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Applied Rule</span>
                    <span className="text-xs font-bold text-indigo-600 mt-0.5 block">{m.metadata?.rule_applied}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">New Price</span>
                    <span className="text-xs font-mono font-extrabold text-slate-800 mt-0.5 block">${m.metadata?.new_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentStatus;
