import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import {
  TrendingUp, Activity, AlertTriangle, CheckCircle,
  BarChart3, PieChart as PieChartIcon, Target, Zap, Download, FileText, XCircle
} from 'lucide-react';
import axios from 'axios';
import ROCDashboard from './ROCDashboard';
import { generateROCPDF } from '../utils/rocPdfGenerator';
import { generateAnalyticsPDF } from '../utils/analyticsPdfGenerator';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-2xl">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300 text-sm">
            {entry.name}: <span className="text-white font-semibold">{entry.value}%</span>
          </span>
        </div>
      ))}
    </div>
  );
};

function Analytics() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    methodDistribution: [],
    statusDistribution: [],
    trendData: [],
    riskData: [],
    avgDegradation: "0.00",
    avgConfidence: "0.0",
    passRate: "0.0"
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsView, setAnalyticsView] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/history`);
      processAnalytics(response.data.calculations);
    } catch (error) {
      console.error('Analytics error:', error);
    }
    setLoading(false);
  };

  const processAnalytics = (calculations) => {
    if (!calculations || calculations.length === 0) {
      setStats({
        totalAnalyses: 0,
        methodDistribution: [],
        statusDistribution: [],
        trendData: [],
        riskData: [],
        avgDegradation: "0.00",
        avgConfidence: "0.0",
        passRate: "0.0"
      });
      return;
    }

    // Method distribution
    const methodCount = {};
    calculations.forEach(calc => {
      if (calc?.recommended_method) {
        methodCount[calc.recommended_method] = (methodCount[calc.recommended_method] || 0) + 1;
      }
    });

    const methodDistribution = Object.entries(methodCount).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / calculations.length) * 100).toFixed(1)
    }));

    // Status distribution
    const statusCount = {};
    calculations.forEach(calc => {
      if (calc?.status) {
        statusCount[calc.status] = (statusCount[calc.status] || 0) + 1;
      }
    });

    const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / calculations.length) * 100).toFixed(1)
    }));

    // Trend over time
    const recentCalcs = [...calculations]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20)
      .reverse();

    const trendData = recentCalcs.map((calc, index) => ({
      index: index + 1,
      lk_imb: calc?.lk_imb || 0,
      cimb: calc?.cimb || 0,
      amb: calc?.amb || 0,
      date: calc?.timestamp ? new Date(calc.timestamp).toLocaleDateString() : 'N/A'
    }));

    // Risk level analysis
    const riskLevels = { LOW: 0, MODERATE: 0, HIGH: 0 };
    calculations.forEach(calc => {
      if (calc?.cimb_risk_level && riskLevels[calc.cimb_risk_level] !== undefined) {
        riskLevels[calc.cimb_risk_level]++;
      }
    });

    const riskData = Object.entries(riskLevels).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / calculations.length) * 100).toFixed(1)
    }));

    // Degradation statistics
    const avgDegradation = calculations.reduce((sum, calc) => sum + (calc?.degradation_level || 0), 0) / calculations.length;
    const avgConfidence = calculations.reduce((sum, calc) => sum + (calc?.confidence_index || 0), 0) / calculations.length;

    setStats({
      totalAnalyses: calculations.length,
      methodDistribution,
      statusDistribution,
      trendData,
      riskData,
      avgDegradation: avgDegradation.toFixed(2),
      avgConfidence: avgConfidence.toFixed(1),
      passRate: ((statusCount['PASS'] || 0) / calculations.length * 100).toFixed(1)
    });
  };


  const handleExportPDF = async () => {
    if (analyticsView === 'roc') {
      try {
        console.log('Generating ROC Analysis PDF...');
        const response = await axios.get(`${API_URL}/roc/config`);
        const rocImageUrl = `${API_URL}/roc/curve?t=${Date.now()}`;
        await generateROCPDF(response.data, rocImageUrl);
      } catch (error) {
        console.error('Failed to generate ROC PDF:', error);
        alert('Could not generate ROC report. Please ensure the optimization engine is running.');
      }
    } else {
      // General PDF export logic here
      console.log('General export not implemented yet.');
    }
  };

  const handleExportData = async () => {
    if (analyticsView === 'roc') {
      await handleExportPDF();
    } else {
      // Generate Overview PDF
      try {
        generateAnalyticsPDF(stats);
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to generate PDF report.');
      }
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[32rem] bg-gradient-to-br from-slate-900/90 to-blue-900/60 rounded-3xl shadow-2xl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-[6px] border-blue-400/20 border-t-blue-500/80 rounded-full shadow-xl"
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-3xl border border-slate-800/40 bg-gradient-to-br from-slate-900/95 to-blue-900/60 backdrop-blur-2xl p-16 text-center shadow-2xl"
      >
        <BarChart3 size={72} className="text-blue-700 mx-auto mb-6 drop-shadow-lg" />
        <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">No Data Available</h3>
        <p className="text-slate-400 text-lg font-medium">
          Perform calculations to see analytics and insights
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 relative"
    >
      {/* Top Bar with View Tabs and Export Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* View Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setAnalyticsView('overview')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${analyticsView === 'overview'
              ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/50'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setAnalyticsView('roc')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${analyticsView === 'roc'
              ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/50'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
          >
            ROC Analysis
          </button>
        </div>

        {/* Export Controls - Top Right */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            className="px-5 py-2.5 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600/50 text-slate-200 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm"
          >
            <FileText size={16} />
            PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportData}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <Download size={16} />
            Export
          </motion.button>
        </div>
      </div>

      {analyticsView === 'overview' ? (
        <div className="space-y-10">
          {/* Top Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-900/90 to-blue-900/50 backdrop-blur-xl p-6 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Analyses</span>
                  <Activity className="text-blue-400" size={18} />
                </div>
                <p className="text-4xl font-black text-white mb-1">{stats.totalAnalyses}</p>
                <p className="text-xs text-slate-400">Completed tests</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-green-400/20 bg-gradient-to-br from-slate-900/90 to-green-900/50 backdrop-blur-xl p-6 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Pass Rate</span>
                  <CheckCircle className="text-green-400" size={18} />
                </div>
                <p className="text-4xl font-black text-white mb-1">{stats.passRate}%</p>
                <p className="text-xs text-slate-400">ICH Q1A(R2) compliant</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-slate-900/90 to-violet-900/50 backdrop-blur-xl p-6 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Avg Confidence</span>
                  <Target className="text-violet-400" size={18} />
                </div>
                <p className="text-4xl font-black text-white mb-1">{stats.avgConfidence}%</p>
                <p className="text-xs text-slate-400">Statistical validity</p>
              </div>
            </div>
          </motion.div>

          {/* Status Analysis - Compact Professional Card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-red-400/20 bg-gradient-to-br from-slate-900/95 to-red-900/40 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-red-400/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="text-red-400" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-red-400 uppercase">Status Analysis</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quality control assessment</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider">OOS</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Mass balance is below acceptable limits. Investigate for undetected degradation products or analytical method deficiencies.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-white mb-1">28.39%</div>
                  <div className="px-2 py-1 bg-red-500/20 rounded text-xs font-bold text-red-300 uppercase tracking-wide">
                    Invalid
                  </div>
                </div>
              </div>

              {/* Method Integrity Indicator */}
              <div className="mt-5 pt-5 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Method Integrity</span>
                  </div>
                  <span className="text-xs font-bold text-green-400">Validated Instrument</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-green-500 to-green-400" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Confidence Score</span>
                  <span className="font-bold text-slate-400">93%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trend Analysis */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-blue-400/10 bg-gradient-to-br from-slate-900/90 to-blue-900/60 backdrop-blur-2xl p-10 shadow-2xl"
          >
            <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase mb-8 flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={16} />
              Mass Balance Trends
            </h3>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorLK" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCIMB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis
                    dataKey="index"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    label={{ value: 'Sample Number', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    label={{ value: 'Mass Balance (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lk_imb"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLK)"
                    name="LK-IMB Core"
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="cimb"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCIMB)"
                    name="CIMB Vector"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Method Distribution */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-violet-400/10 bg-gradient-to-br from-slate-900/90 to-violet-900/60 backdrop-blur-2xl p-10 shadow-2xl"
          >
            <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase mb-8 flex items-center gap-2">
              <PieChartIcon className="text-violet-400" size={16} />
              Methodology Distribution
            </h3>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.methodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={2000}
                  >
                    {stats.methodDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Distribution & Risk Assessment */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Status Distribution */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-green-400/10 bg-gradient-to-br from-slate-900/90 to-green-900/60 backdrop-blur-xl p-8 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="text-green-400" size={20} />
                Status Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Risk Assessment */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-orange-400/10 bg-gradient-to-br from-slate-900/90 to-orange-900/60 backdrop-blur-xl p-8 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="text-orange-400" size={20} />
                Risk Profile
              </h3>
              <div className="space-y-4">
                {stats.riskData.map((risk, index) => {
                  const colors = {
                    LOW: { bg: 'bg-green-500/10', bar: 'bg-green-500', text: 'text-green-400' },
                    MODERATE: { bg: 'bg-yellow-500/10', bar: 'bg-yellow-500', text: 'text-yellow-400' },
                    HIGH: { bg: 'bg-red-500/10', bar: 'bg-red-500', text: 'text-red-400' }
                  };
                  return (
                    <div
                      key={risk.name}
                      className={`p-4 ${colors[risk.name].bg} rounded-xl border border-slate-700/50 hover:bg-slate-800/30 transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">{risk.name}</span>
                        <span className={`${colors[risk.name].text} font-bold`}>
                          {risk.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.percentage}%` }}
                          transition={{ duration: 1.5, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                          className={`h-full ${colors[risk.name].bar}`}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {risk.value} samples
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Insights Panel */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-blue-400/10 bg-gradient-to-br from-slate-900/90 to-blue-900/60 backdrop-blur-xl p-10 shadow-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/15 rounded-lg border border-blue-500/20 shadow-md">
                <Zap className="text-blue-400" size={28} />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight drop-shadow">AI-Powered Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-green-500/10 rounded-2xl border border-green-500/20 hover:bg-green-500/20 transition-colors shadow-md">
                <CheckCircle className="text-green-400 mb-4" size={28} />
                <h4 className="text-lg text-white font-bold mb-2">High Success Rate</h4>
                <p className="text-base text-slate-300 font-medium">
                  {stats.passRate}% of analyses meet ICH Q1A(R2) requirements
                </p>
              </div>
              <div className="p-8 bg-blue-500/10 rounded-2xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors shadow-md">
                <Target className="text-blue-400 mb-4" size={28} />
                <h4 className="text-lg text-white font-bold mb-2">Optimal Methods</h4>
                <p className="text-base text-slate-300 font-medium">
                  CIMB and LK-IMB provide superior statistical validation
                </p>
              </div>
              <div className="p-8 bg-violet-500/10 rounded-2xl border border-violet-500/20 hover:bg-violet-500/20 transition-colors shadow-md">
                <TrendingUp className="text-violet-400 mb-4" size={28} />
                <h4 className="text-lg text-white font-bold mb-2">Quality Trend</h4>
                <p className="text-base text-slate-300 font-medium">
                  Confidence index averaging {stats.avgConfidence}% across all tests
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <ROCDashboard />
      )}
    </motion.div>
  );
}

export default Analytics;