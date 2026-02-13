import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import {
  TrendingUp, Activity, AlertTriangle, CheckCircle,
  BarChart3, PieChart as PieChartIcon, Target, Zap
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

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
      setStats(null);
      return;
    }

    // Method usage distribution
    const methodCount = {};
    calculations.forEach(calc => {
      methodCount[calc.recommended_method] = (methodCount[calc.recommended_method] || 0) + 1;
    });

    const methodDistribution = Object.entries(methodCount).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / calculations.length) * 100).toFixed(1)
    }));

    // Status distribution
    const statusCount = {};
    calculations.forEach(calc => {
      statusCount[calc.status] = (statusCount[calc.status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / calculations.length) * 100).toFixed(1)
    }));

    // Trend over time
    const recentCalcs = calculations
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20)
      .reverse();

    const trendData = recentCalcs.map((calc, index) => ({
      index: index + 1,
      lk_imb: calc.lk_imb,
      cimb: calc.cimb,
      amb: calc.amb,
      date: new Date(calc.timestamp).toLocaleDateString()
    }));

    // Risk level analysis
    const riskLevels = {
      LOW: 0,
      MODERATE: 0,
      HIGH: 0
    };
    calculations.forEach(calc => {
      if (calc.cimb_risk_level) {
        riskLevels[calc.cimb_risk_level]++;
      }
    });

    const riskData = Object.entries(riskLevels).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / calculations.length) * 100).toFixed(1)
    }));

    // Degradation statistics
    const avgDegradation = calculations.reduce((sum, calc) => sum + (calc.degradation_level || 0), 0) / calculations.length;
    const avgConfidence = calculations.reduce((sum, calc) => sum + (calc.confidence_index || 0), 0) / calculations.length;

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
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-12 text-center"
      >
        <BarChart3 size={64} className="text-slate-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-slate-400">
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Intelligence Dashboard</h2>
            <p className="text-slate-400 text-sm">
              Comprehensive analytics across {stats.totalAnalyses} analyses
            </p>
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-slate-800"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Analyses',
            value: stats.totalAnalyses,
            icon: Activity,
            color: 'blue',
            change: '+12%'
          },
          {
            label: 'Pass Rate',
            value: `${stats.passRate}%`,
            icon: CheckCircle,
            color: 'green',
            change: '+5%'
          },
          {
            label: 'Avg Degradation',
            value: `${stats.avgDegradation}%`,
            icon: TrendingUp,
            color: 'orange',
            change: '-3%'
          },
          {
            label: 'Avg Confidence',
            value: `${stats.avgConfidence}%`,
            icon: Target,
            color: 'violet',
            change: '+2%'
          }
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              className="relative overflow-hidden rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 hover:border-slate-700/50 transition-colors"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${metric.color}-500/10 to-transparent blur-2xl`} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`text-${metric.color}-400`} size={24} />
                  <span className="text-xs text-green-400 font-semibold">{metric.change}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-sm text-slate-400">{metric.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={20} />
            Historical Trend
          </h3>

          <ResponsiveContainer width="100%" height={300}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="index"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="lk_imb"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorLK)"
                name="LK-IMB"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="cimb"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#colorCIMB)"
                name="CIMB"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Method Distribution */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="text-violet-400" size={20} />
            Method Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.methodDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1500}
              >
                {stats.methodDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
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
          className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
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
        className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Zap className="text-blue-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">AI-Powered Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors">
            <CheckCircle className="text-green-400 mb-3" size={24} />
            <h4 className="text-white font-semibold mb-2">High Success Rate</h4>
            <p className="text-sm text-slate-400">
              {stats.passRate}% of analyses meet ICH Q1A(R2) requirements
            </p>
          </div>

          <div className="p-6 bg-blue-500/10 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <Target className="text-blue-400 mb-3" size={24} />
            <h4 className="text-white font-semibold mb-2">Optimal Methods</h4>
            <p className="text-sm text-slate-400">
              CIMB and LK-IMB provide superior statistical validation
            </p>
          </div>

          <div className="p-6 bg-violet-500/10 rounded-xl border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
            <TrendingUp className="text-violet-400 mb-3" size={24} />
            <h4 className="text-white font-semibold mb-2">Quality Trend</h4>
            <p className="text-sm text-slate-400">
              Confidence index averaging {stats.avgConfidence}% across all tests
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Analytics;
