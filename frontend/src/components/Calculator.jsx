import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Results from './Results';
import { generatePDF } from '../utils/pdfGenerator';
import {
  Beaker, Save, RotateCcw, Sparkles, AlertCircle,
  Info, TrendingUp, Zap, ChevronRight, Download, AlertTriangle, FileText
} from 'lucide-react';
import HybridDetection from './HybridDetection';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

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
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [existingTests, setExistingTests] = useState([]);
  const [hybridConfig, setHybridConfig] = useState({
    detection_method: 'UV',
    uv_rrf: 1.0,
    elsd_rrf: null,
    ms_intensity: null,
    gc_ms_detected: false,
    gc_ms_volatiles: 0
  });

  // Check for duplicate sample IDs
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!inputs.sample_id || inputs.sample_id.trim() === '') {
        setDuplicateWarning(false);
        setExistingTests([]);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/history`);
        const calculations = response.data.calculations || [];

        const duplicates = calculations.filter(
          calc => calc.sample_id && calc.sample_id.toLowerCase() === inputs.sample_id.toLowerCase()
        );

        if (duplicates.length > 0) {
          setDuplicateWarning(true);
          setExistingTests(duplicates);
        } else {
          setDuplicateWarning(false);
          setExistingTests([]);
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    };

    const timer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timer);
  }, [inputs.sample_id]);

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
      const response = await axios.post(`${API_URL}/calculate`, {
        ...inputs,
        ...hybridConfig
      });
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
    setDuplicateWarning(false);
    setExistingTests([]);
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/excel/generate`,
        inputs,
        { responseType: 'blob' }
      );

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

  const handleDownloadPDF = () => {
    if (results) {
      generatePDF({
        mb_results: results.results,
        correction_factors: results.correction_factors,
        recommended_method: results.recommended_method,
        recommended_value: results.recommended_value,
        status: results.status,
        diagnostic_message: results.diagnostic_message,
        rationale: results.rationale,
        degradation_level: results.degradation_level
      }, inputs);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
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



      {/* Hybrid Detection Configuration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <HybridDetection onConfigChange={setHybridConfig} />
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

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Parameters */}
          <div className="xl:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inputFields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <label className="block group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase group-hover:text-blue-400 transition-colors">
                        {field.label}
                      </span>
                      <Tooltip content={field.tooltip}>
                        <Info size={12} className="text-slate-600 hover:text-blue-400" />
                      </Tooltip>
                    </div>
                    <div className="relative group/input">
                      <input
                        type="number"
                        name={field.name}
                        value={inputs[field.name]}
                        onChange={handleInputChange}
                        step={field.step}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all hover:bg-slate-800/50 shadow-inner"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-blue-500 transform scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500" />
                    </div>
                  </label>
                </motion.div>
              ))}

              {/* Stress Condition Select */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block group">
                  <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 group-hover:text-blue-400 transition-colors">
                    Stress Condition
                  </div>
                  <select
                    name="stress_type"
                    value={inputs.stress_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all hover:bg-slate-800/50 cursor-pointer appearance-none shadow-inner"
                  >
                    <option value="Acid">Acid Hydrolysis</option>
                    <option value="Base">Base Hydrolysis</option>
                    <option value="Oxidative">Oxidative</option>
                    <option value="Photolytic">Photolytic</option>
                    <option value="Thermal">Thermal</option>
                  </select>
                </label>
              </motion.div>
            </div>
          </div>

          {/* Sidebar Inputs (IDs, Analyst) */}
          <div className="space-y-6 xl:border-l xl:border-white/5 xl:pl-8">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Sample Reference</span>
                <input
                  type="text"
                  name="sample_id"
                  value={inputs.sample_id}
                  onChange={handleInputChange}
                  placeholder="ID#"
                  className={`w-full px-4 py-2 text-sm bg-slate-900/50 border rounded-lg text-white font-mono focus:outline-none transition-all ${duplicateWarning ? 'border-amber-500/40 text-amber-400' : 'border-white/5 focus:border-blue-500/50'
                    }`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Analyst Signature</span>
                <input
                  type="text"
                  name="analyst_name"
                  value={inputs.analyst_name}
                  onChange={handleInputChange}
                  placeholder="Name"
                  className="w-full px-4 py-2 text-sm bg-slate-900/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </label>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                  <span>Instrument Status</span>
                  <span className="text-emerald-500 animate-pulse flex items-center gap-1">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full" /> Ready
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono leading-relaxed">
                  MODULE: CALC-ENGINE-V2<br />
                  LATENCY: ~14ms<br />
                  MODEL: ICH-STABILITY-X1
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-white/5">
          <button
            onClick={() => handleCalculate(false)}
            disabled={loading || autoCalculate}
            className="flex-1 min-w-[200px] h-14 relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={18} />
                  Initiate Analysis
                </>
              )}
            </span>
          </button>

          {results && (
            <>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleSave}
                className={`px-8 h-14 rounded-xl font-bold uppercase tracking-wider transition-all border ${saved ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
              >
                <Save size={18} className="inline mr-2" />
                {saved ? 'Secured' : 'Archive Data'}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleDownloadPDF}
                className="px-8 h-14 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-600/30 transition-all"
              >
                <FileText size={18} className="inline mr-2" />
                PDF Report
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleDownloadExcel}
                className="px-8 h-14 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold uppercase tracking-wider hover:bg-emerald-600/30 transition-all"
              >
                <Download size={18} className="inline mr-2" />
                Excel Report
              </motion.button>
            </>
          )}

          <button
            onClick={handleReset}
            className="px-8 h-14 bg-white/5 border border-white/10 text-slate-500 hover:text-white rounded-xl font-bold uppercase tracking-wider transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>

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

      {/* Duplicate Sample ID Warning */}
      {duplicateWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-2xl border border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-slate-900/50 backdrop-blur-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex-shrink-0">
              <AlertTriangle className="text-yellow-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                Duplicate Sample ID Detected
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                Sample ID "<span className="font-mono font-bold text-yellow-400">{inputs.sample_id}</span>" already exists in the database with {existingTests.length} previous test{existingTests.length > 1 ? 's' : ''}.
              </p>
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-semibold">Existing tests:</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {existingTests.slice(0, 5).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{test.sample_id}</span>
                          <span className="text-slate-500 text-xs">•</span>
                          <span className="text-slate-400 text-xs">
                            {new Date(test.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{test.analyst_name}</span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-xs text-blue-400">{test.recommended_method}</span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className={`text-xs font-semibold ${test.status === 'PASS' ? 'text-green-400' :
                            test.status === 'ALERT' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {test.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {existingTests.length > 5 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      +{existingTests.length - 5} more test{existingTests.length - 5 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-xs">
                  <strong>Note:</strong> You can proceed with this Sample ID. The system will differentiate tests using timestamps and unique calculation IDs.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Component */}
      {results && <Results results={results} inputs={inputs} />}
    </motion.div>
  );
}

export default Calculator;