import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    BarChart3, TrendingUp, RefreshCw, Download, CheckCircle,
    AlertTriangle, XCircle, Target, Zap
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

function ROCDashboard() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retraining, setRetraining] = useState(false);
    const [rocImageUrl, setRocImageUrl] = useState(null);

    useEffect(() => {
        fetchConfig();
        setRocImageUrl(`${API_URL}/roc/curve?t=${Date.now()}`);
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/roc/config`);
            setConfig(response.data);
        } catch (error) {
            console.error('Error fetching ROC config:', error);
        }
        setLoading(false);
    };

    const handleRetrain = async () => {
        if (!confirm('Retrain ROC model? This will update CI thresholds based on latest data.')) {
            return;
        }

        setRetraining(true);
        try {
            const response = await axios.post(`${API_URL}/roc/retrain`);
            alert(`ROC model retrained! New threshold: ${response.data.new_threshold}`);
            await fetchConfig();
            setRocImageUrl(`${API_URL}/roc/curve?t=${Date.now()}`);
        } catch (error) {
            alert('Retraining failed: ' + error.message);
        }
        setRetraining(false);
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

    if (!config) {
        return (
            <div className="text-center py-12">
                <BarChart3 size={64} className="text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">ROC Config Not Found</h3>
                <p className="text-slate-400 mb-4">Run Python optimizer to generate</p>
                <code className="bg-slate-800 text-green-400 px-4 py-2 rounded text-sm">
                    python backend/roc_optimizer.py
                </code>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Optimized Intelligence Header */}
            <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl p-8 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-[100px] rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20 shadow-lg shadow-violet-500/5">
                            <Target className="text-violet-400" size={32} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase mb-2">Neural Optimization</h3>
                            <h1 className="text-3xl font-black text-white tracking-tight">ROC Performance Vector</h1>
                            <p className="text-slate-400 text-sm mt-1 font-medium italic">Data-driven threshold calibration • Cycle trained: {config.training_date}</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRetrain}
                        disabled={retraining}
                        className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-violet-500/20 border border-violet-400/20"
                    >
                        <RefreshCw size={18} className={retraining ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                        {retraining ? 'Synthesizing...' : 'Calibrate Thresholds'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Performance Telemetry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Optimal Limit', value: config.optimal_ci_threshold, icon: Zap, color: 'violet', desc: 'DATA-OPTIMIZED CI' },
                    { label: 'AUC Precision', value: config.model_performance.auc.toFixed(3), icon: BarChart3, color: 'emerald', desc: 'CURVE AREA INDEX' },
                    { label: 'Sensitivity', value: `${(config.model_performance.sensitivity * 100).toFixed(1)}%`, icon: TrendingUp, color: 'blue', desc: 'TRUE POSITIVE GAIN' },
                    { label: 'System Logic', value: `${(config.model_performance.accuracy * 100).toFixed(1)}%`, icon: CheckCircle, color: 'cyan', desc: 'GLOBAL ACCURACY' }
                ].map((metric) => (
                    <motion.div
                        key={metric.label}
                        whileHover={{ y: -5 }}
                        className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl p-8 group"
                    >
                        <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-6 flex justify-between items-center text-center">
                            {metric.label}
                            <metric.icon size={14} className={metric.color === 'violet' ? 'text-violet-400' : metric.color === 'emerald' ? 'text-emerald-400' : metric.color === 'blue' ? 'text-blue-400' : 'text-cyan-400'} />
                        </div>
                        <div className="text-4xl font-black text-white font-mono tracking-tighter mb-2">
                            {metric.value}
                        </div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            {metric.desc}
                        </div>
                        <div className={`absolute bottom-0 inset-x-0 h-1 bg-${metric.color}-500 opacity-20`} />
                    </motion.div>
                ))}
            </div>

            {/* ROC Curve Logic Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase flex items-center gap-2">
                            <BarChart3 className="text-violet-400" size={16} />
                            Signal Response Matrix (ROC)
                        </h3>
                    </div>

                    {rocImageUrl ? (
                        <div className="bg-slate-950/40 rounded-3xl p-6 border border-white/5 shadow-inner">
                            <img
                                src={rocImageUrl}
                                alt="ROC Curve"
                                className="w-full h-auto rounded-xl opacity-90 hover:opacity-100 transition-opacity"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{ display: 'none' }} className="flex-col items-center justify-center py-24 text-slate-600 gap-4">
                                <AlertTriangle size={48} className="opacity-20 text-center" />
                                <div className="text-center">
                                    <p className="font-black text-[10px] uppercase tracking-widest">Awaiting Visualization Feed</p>
                                    <p className="text-[9px] mt-1 italic">Run optimization script to generate assets</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                            <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Syncing Visualization...</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Risk Stratification */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl p-8 shadow-xl h-full">
                        <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mb-8 flex items-center gap-2">
                            <TrendingUp className="text-violet-400" size={16} />
                            Threshold Stratification
                        </h3>

                        <div className="space-y-5">
                            {Object.entries(config.risk_classification).map(([level, info]) => {
                                const icons = { 'LOW': CheckCircle, 'MODERATE': AlertTriangle, 'HIGH': XCircle };
                                const colors = { 'LOW': 'emerald', 'MODERATE': 'yellow', 'HIGH': 'red' };
                                const Icon = icons[level];
                                const color = colors[level];

                                return (
                                    <div
                                        key={level}
                                        className={`p-5 rounded-2xl border bg-${color}-500/5 border-${color}-500/10 hover:border-${color}-500/30 transition-all group`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 bg-${color}-500/10 rounded-xl`}>
                                                <Icon className={`text-${color}-400`} size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`text-[10px] font-black text-${color}-400 uppercase tracking-widest`}>{level} RISK ZONE</h4>
                                                    <span className="text-[10px] font-black text-white font-mono opacity-60">
                                                        [{info.ci_range[0]}-{info.ci_range[1]}]
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic opacity-80">
                                                    {info.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Implementation Flux Notes */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/10 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Zap className="text-blue-400" size={16} />
                    </div>
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Technical Integration Protocol</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    {config.usage_notes.map((note, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <span className="text-blue-500 font-black mt-0.5">•</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-80">{note}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default ROCDashboard;
