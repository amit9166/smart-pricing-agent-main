import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Cpu, 
  FileText, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import axiosClient from '../01-api/axiosClient';

// Global toast alert callback hook
export let showNotification = () => {};

const MainLayout = () => {
  const [agentStatus, setAgentStatus] = useState({ status: 'offline', vector_memory_count: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  
  // Tasks onboarding state
  const [completedSteps, setCompletedSteps] = useState({
    addProduct: false,
    addCompetitor: false,
    runAgents: false,
  });

  // Success / Error Toast notification state
  const [toast, setToast] = useState(null);
  
  showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const location = useLocation();

  const fetchStatus = async () => {
    try {
      const res = await axiosClient.get('/dashboard/stats');
      setAgentStatus({
        status: res.data.agentServiceStatus,
        vector_memory_count: res.data.priceChanges
      });
      
      // Update task checklist step values based on database counts
      setCompletedSteps({
        addProduct: res.data.products > 0,
        addCompetitor: res.data.competitors > 0,
        runAgents: res.data.priceChanges > 0
      });
    } catch (err) {
      setAgentStatus({ status: 'offline', vector_memory_count: 0 });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalRun = async () => {
    setIsRunning(true);
    showNotification('Initializing Pricing Brain Agent...', 'info');
    try {
      await axiosClient.post('/pricing/run', {});
      showNotification('Pricing optimization run started in background!');
      // Trigger status fetch to sync checklist progress
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      showNotification(`Failed: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products Store', path: '/products', icon: ShoppingBag },
    { name: 'Competitors Tracker', path: '/competitors', icon: Users },
    { name: 'Pricing Brain', path: '/pipeline', icon: Cpu },
    { name: 'Activity Log', path: '/logs', icon: FileText }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-700 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight text-slate-800">Antigravity</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Pricing</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 font-semibold text-sm ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.05)]' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Connection Status Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-400 font-semibold">Pricing Engine:</span>
            <span className="flex items-center space-x-1.5 font-bold">
              {agentStatus.status === 'online' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-online-pulse" />
                  <span className="text-emerald-600 uppercase text-[10px]">Connected</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-500 uppercase text-[10px]">Offline</span>
                </>
              )}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 leading-relaxed font-medium">
            AI is operating in safe mode under business bounds check.
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Controls */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {navItems.find((n) => n.path === location.pathname)?.name || 'Pricing Portal'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Automated market intelligence hub</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGlobalRun}
              disabled={isRunning || agentStatus.status === 'offline'}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs btn-animate transition-all border ${
                agentStatus.status === 'offline'
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-[0_2px_12px_rgba(99,102,241,0.2)]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Optimize Prices Now</span>
            </button>
          </div>
        </header>

        {/* Scrollable Panel Frame */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* ONBOARDING checklist widget */}
          {checklistOpen && (
            <div className="soft-card-glowing bg-white p-6 relative">
              <button 
                onClick={() => setChecklistOpen(false)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                <span>Getting Started Checklist</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                Welcome to Antigravity! Complete these three quick steps to configure the system and activate automated AI pricing optimization.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {/* Step 1 */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3 ${completedSteps.addProduct ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${completedSteps.addProduct ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">1. Add a Product Item</span>
                    <span className="text-[10px] text-slate-500 leading-normal mt-1 block">Configure your catalog items with a baseline Cost and Selling Price.</span>
                  </div>
                </div>
                {/* Step 2 */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3 ${completedSteps.addCompetitor ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${completedSteps.addCompetitor ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">2. Track Competitor Link</span>
                    <span className="text-[10px] text-slate-500 leading-normal mt-1 block">Track competitor web links to fetch competitor price points.</span>
                  </div>
                </div>
                {/* Step 3 */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3 ${completedSteps.runAgents ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${completedSteps.runAgents ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">3. Run Dynamic Optimization</span>
                    <span className="text-[10px] text-slate-500 leading-normal mt-1 block">Trigger the agents to scrape, evaluate reviews, and optimize prices.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actual Page Render */}
          <Outlet />
        </main>
      </div>

      {/* Floating Success / Info Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-200">
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Responsive bottom navigation on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 px-6 flex justify-around items-center z-40 shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center space-y-1 text-slate-400 transition-colors ${isActive ? 'text-indigo-600' : ''}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase">{item.name.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </div>

    </div>
  );
};

export default MainLayout;
