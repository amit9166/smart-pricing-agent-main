import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info, RotateCcw, Clock } from 'lucide-react';
import axiosClient from '../01-api/axiosClient';
import { showNotification } from '../04-layout/MainLayout';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLogs = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/pricing/logs?page=${pageNumber}&limit=15`);
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showNotification('Failed to fetch activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStepDescription = (log) => {
    // Convert technical agent names to friendly descriptors
    switch (log.agentName) {
      case 'Monitoring Agent':
        return `Price Scraper checked competitor prices.`;
      case 'Sentiment Agent':
        return `Buzz Tracker evaluated social reviews and customer interest.`;
      case 'Memory Agent':
        return `Memory Agent checked similar past pricing decisions.`;
      case 'Pricing Agent':
        return `Price Optimizer calculated recommended dynamic price.`;
      case 'Execution Agent':
        return `Catalog Sync applied final pricing changes to database.`;
      case 'Manual Override':
        return `User manually modified product selling price.`;
      default:
        return log.message || 'Pricing brain step completed.';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Success</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center space-x-1 text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wide">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Alert</span>
          </span>
        );
      case 'started':
        return (
          <span className="flex items-center space-x-1 text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wide animate-pulse">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>Started</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wide">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Info</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Activity Timeline List */}
      <div className="soft-card overflow-hidden bg-white shadow-sm">
        
        {/* Title and controls */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Clock className="w-4.5 h-4.5 text-indigo-500" />
            <span>Activity History Timeline</span>
          </h3>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="text-xs bg-white hover:bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition duration-150 btn-animate"
          >
            Refresh Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Time</th>
                <th className="p-4">Run Code</th>
                <th className="p-4">Step Activity</th>
                <th className="p-4">Status</th>
                <th className="p-4">Summary Description</th>
                <th className="p-4 pr-6 text-right">Raw Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-xs">
              
              {/* Skeleton loading placeholders */}
              {loading ? (
                [1, 2, 3, 4].map(n => (
                  <tr key={n}>
                    <td className="p-4 pl-6"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="p-4"><div className="h-4 w-16 skeleton rounded" /></td>
                    <td className="p-4"><div className="h-4 w-32 skeleton rounded" /></td>
                    <td className="p-4"><div className="h-4.5 w-16 skeleton rounded" /></td>
                    <td className="p-4"><div className="h-4 w-48 skeleton rounded" /></td>
                    <td className="p-4 pr-6 text-right"><div className="h-4 w-10 skeleton rounded ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                        <FileText className="w-8 h-8 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">No Activity History</h4>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        No agent logs or manual overrides have been logged yet. Configure your products and start pricing optimizations!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-[10px]">{log.runId}</td>
                      <td className="p-4 font-bold text-slate-700">{log.agentName.replace(' Agent', '')}</td>
                      <td className="p-4">{getStatusBadge(log.status)}</td>
                      <td className="p-4 text-slate-600 font-medium">{getStepDescription(log)}</td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                        >
                          {expandedLog === log._id ? 'Hide JSON' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedLog === log._id && (
                      <tr className="bg-slate-50/40">
                        <td colSpan="6" className="p-6 pl-10 pr-6 border-b border-slate-100">
                          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto shadow-inner">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Technical Diagnostic Payload:</span>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(log.payload, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
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
                onClick={() => fetchLogs(pagination.page - 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
