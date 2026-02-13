import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Results from './Results';
import {
  Beaker, Save, RotateCcw, Sparkles, AlertCircle,
  Info, TrendingUp, Zap, ChevronRight, Download
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// Tooltip component for educational context
const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl border border-slate-700 whitespace-nowrap"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-slate-800" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

function Calculator() {
  const [inputs, setInputs] = useState({
    initial_api: 98,
    stressed_api: 82.5,
    initial_degradants: 0.5,
    stressed_degradants: 4.9,
    degradant_mw: 250,
    parent_mw: 500,
    rrf: 0.8,
    stress_type: 'Base',
    sample_id: 'ABC-001',
    analyst_name: 'Lab Analyst'
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Real-time calculation with debounce
  useEffect(() => {
    if (!autoCalculate) return;

    const timer = setTimeout(() => {
      handleCalculate(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [inputs, autoCalculate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name.includes('_type') || name.includes('_id') || name.includes('_name')
        ? value
        : parseFloat(value) || ''
    }));
    setSaved(false);

    if (autoCalculate) {
      setCalculating(true);
    }
  };

  const handleCalculate = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/calculate`, inputs);
      setResults(response.data);
      setCalculating(false);
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculating(false);
    }
    if (!silent) setLoading(false);
  };

  const handleSave = async () => {
    if (!results) return;
    try {
      await axios.post(`${API_URL}/save`, { inputs, results });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleReset = () => {
    setInputs({
      initial_api: 98,
      stressed_api: 82.5,
      initial_degradants: 0.5,
      stressed_degradants: 4.9,
      degradant_mw: 250,
      parent_mw: 500,
      rrf: 0.8,
      stress_type: 'Base',
      sample_id: '',
      analyst_name: ''
    });
    setResults(null);
    setSaved(false);
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/excel/generate`,
        inputs,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${inputs.sample_id}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate Excel report');
    }
  };

  const inputFields = [
    {
      name: 'initial_api',
      label: 'Initial API (%)',
      step: '0.1',
      tooltip: 'Starting purity of Active Pharmaceutical Ingredient before stress testing'
    },
    {
      name: 'stressed_api',
      label: 'Stressed API (%)',
      step: '0.1',
      tooltip: 'API purity after forced degradation conditions'
    },
    {
      name: 'initial_degradants',
      label: 'Initial Degradants (%)',
      step: '0.1',
      tooltip: 'Baseline impurity level before stress'
    },
    {
      name: 'stressed_degradants',
      label: 'Stressed Degradants (%)',
      step: '0.1',
      tooltip: 'Degradation products formed during stress testing'
    },
    {
      name: 'parent_mw',
      label: 'Parent MW (g/mol)',
      step: '1',
      tooltip: 'Molecular weight of the parent API molecule'
    },
    {
      name: 'degradant_mw',
      label: 'Degradant MW (g/mol)',
      step: '1',
      tooltip: 'Molecular weight of the primary degradation product'
    },
    {
      name: 'rrf',
      label: 'RRF (Response Factor)',
      step: '0.1',
      tooltip: 'Relative Response Factor - detector sensitivity ratio'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-violet-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Beaker className="text-blue-400" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Analysis Laboratory</h2>
              </div>
              <p className="text-slate-400 text-sm">
                Pharmaceutical forced degradation study with dual statistical validation
              </p>
            </div>

            {/* Auto-calculate Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={autoCalculate}
                    onChange={(e) => setAutoCalculate(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${autoCalculate ? 'bg-blue-500' : 'bg-slate-700'
                    }`}>
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full mx-1"
                      animate={{ x: autoCalculate ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  Real-time
                </span>
                {calculating && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap size={16} className="text-blue-400" />
                  </motion.div>
                )}
              </label>
            </div>
          </div>

          {/* Status Indicator */}
          {results && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg w-fit"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Analysis Complete</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />

        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-400" />
          Experimental Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inputFields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <label className="block mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {field.label}
                  </span>
                  <Tooltip content={field.tooltip}>
                    <Info size={14} className="text-slate-500 hover:text-blue-400 transition-colors" />
                  </Tooltip>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name={field.name}
                    value={inputs[field.name]}
                    onChange={handleInputChange}
                    step={field.step}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm hover:bg-slate-800/70"
                  />
                  {calculating && autoCalculate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </label>
            </motion.div>
          ))}

          {/* Stress Type Dropdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="group"
          >
            <label className="block mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Stress Condition
                </span>
                <Tooltip content="Type of forced degradation applied to the sample">
                  <Info size={14} className="text-slate-500 hover:text-blue-400 transition-colors" />
                </Tooltip>
              </div>
              <select
                name="stress_type"
                value={inputs.stress_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm hover:bg-slate-800/70 cursor-pointer"
              >
                <option value="Acid">Acid Hydrolysis</option>
                <option value="Base">Base Hydrolysis</option>
                <option value="Oxidative">Oxidative</option>
                <option value="Photolytic">Photolytic</option>
                <option value="Thermal">Thermal</option>
              </select>
            </label>
          </motion.div>

          {/* Sample ID */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block mb-2">
              <span className="text-sm font-medium text-slate-300 mb-2 block">
                Sample ID
              </span>
              <input
                type="text"
                name="sample_id"
                value={inputs.sample_id}
                onChange={handleInputChange}
                placeholder="e.g., ABC-001"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm hover:bg-slate-800/70"
              />
            </label>
          </motion.div>

          {/* Analyst Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <label className="block mb-2">
              <span className="text-sm font-medium text-slate-300 mb-2 block">
                Analyst Name
              </span>
              <input
                type="text"
                name="analyst_name"
                value={inputs.analyst_name}
                onChange={handleInputChange}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm hover:bg-slate-800/70"
              />
            </label>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-4 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => handleCalculate(false)}
            disabled={loading || autoCalculate}
            className="flex-1 relative group overflow-hidden bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-violet-400 opacity-0 group-hover:opacity-20 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={20} />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Calculate Mass Balance
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>

          {results && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleSave}
                className={`px-6 py-4 rounded-xl font-semibold transition-all flex items-center gap-2 ${saved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  }`}
              >
                <Save size={20} />
                {saved ? 'Saved!' : 'Save'}
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleDownloadExcel}
                className="px-6 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white border border-green-500 font-semibold transition-all flex items-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
              >
                <Download size={20} />
                Download Excel
              </motion.button>
            </>
          )}

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleReset}
            className="px-6 py-4 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50 font-semibold transition-all flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Reset
          </motion.button>
        </motion.div>

        {/* Info Banner */}
        {!autoCalculate && !results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
          >
            <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <strong>Tip:</strong> Enable <strong>Real-time</strong> mode for instant calculations as you type.
              Results update automatically with statistical validation.
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Component */}
      {results && <Results results={results} inputs={inputs} />}
    </div>
  );
}

export default Calculator;
