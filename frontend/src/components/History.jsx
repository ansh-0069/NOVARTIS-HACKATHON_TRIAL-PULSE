import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Trash2, Search, Filter, ChevronLeft, ChevronRight,
  Calendar, User, Beaker, CheckCircle, AlertTriangle,
  XCircle, Download, Eye
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

function History() {
  const [calculations, setCalculations] = useState([]);
  const [filteredCalculations, setFilteredCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, [page]);

  useEffect(() => {
    filterCalculations();
  }, [searchTerm, statusFilter, methodFilter, calculations]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/history`, {
        params: { page, limit: 20 }
      });
      setCalculations(response.data.calculations || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching history:', error);
      setCalculations([]);
    }
    setLoading(false);
  };

  const filterCalculations = () => {
    let filtered = [...calculations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(calc =>
        (calc.sample_id && calc.sample_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (calc.analyst_name && calc.analyst_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(calc => calc.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(calc => calc.recommended_method === methodFilter);
    }

    setFilteredCalculations(filtered);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;

    try {
      await axios.delete(`${API_URL}/calculation/${id}`);
      fetchHistory();
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  const handleDownloadHistory = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/excel/history?limit=1000`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `History_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate history report');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PASS': {
        icon: CheckCircle,
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20'
      },
      'ALERT': {
        icon: AlertTriangle,
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20'
      },
      'OOS': {
        icon: XCircle,
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20'
      }
    };
    return configs[status] || configs['OOS'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Calculation Archive</h2>
            <p className="text-slate-400 text-sm">
              {total} total analyses • Showing {filteredCalculations.length} results
            </p>
          </div>
          <button
            onClick={handleDownloadHistory}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Download size={18} />
            Export History
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by sample ID or analyst..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PASS">Pass</option>
              <option value="ALERT">Alert</option>
              <option value="OOS">OOS</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="relative">
            <Beaker className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="SMB">SMB</option>
              <option value="AMB">AMB</option>
              <option value="RMB">RMB</option>
              <option value="LK-IMB">LK-IMB</option>
              <option value="CIMB">CIMB</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {filteredCalculations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-12 text-center"
        >
          <Eye size={64} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
          <p className="text-slate-400">
            {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No calculations saved yet'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sample ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      Analyst
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Beaker size={14} />
                      Method
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredCalculations.map((calc, index) => {
                    const statusConfig = getStatusConfig(calc.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.tr
                        key={calc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {new Date(calc.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-sm font-mono text-blue-400 font-semibold">
                              {calc.sample_id || '-'}
                            </span>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {new Date(calc.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {calc.analyst_name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400 font-medium">
                            {calc.stress_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-semibold border border-blue-500/20">
                            {calc.recommended_method}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-white">
                            {calc.recommended_value}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                            <StatusIcon size={14} />
                            <span className="text-xs font-semibold">
                              {calc.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(calc.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                            title="Delete calculation"
                          >
                            <Trash2
                              size={16}
                              className="text-slate-500 group-hover:text-red-400 transition-colors"
                            />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <div className="text-sm text-slate-400">
              Showing {filteredCalculations.length} of {total} results
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm text-white"
              >
                <ChevronLeft size={16} />
                Previous
              </motion.button>
              <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg font-semibold text-sm border border-blue-500/20">
                Page {page}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm text-white"
              >
                Next
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default History;