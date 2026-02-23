import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Activity, Calendar, Clock, TrendingUp, AlertCircle,
    CheckCircle, Plus, ChevronRight, BarChart2, Beaker,
    Trash2
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

function StabilityMonitor() {
    const [studies, setStudies] = useState([]);
    const [selectedStudy, setSelectedStudy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddStudy, setShowAddStudy] = useState(false);
    const [prediction, setPrediction] = useState(null);

    // New Study Form
    const [newStudy, setNewStudy] = useState({
        product_name: '',
        batch_number: '',
        storage_conditions: '25C/60RH',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        fetchStudies();
    }, []);

    const fetchStudies = async () => {
        try {
            const response = await axios.get(`${API_URL}/stability/studies`);
            if (response.data.success) {
                setStudies(response.data.studies);
            }
        } catch (error) {
            console.error('Error fetching stability studies:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudyDetails = async (id) => {
        try {
            setPrediction(null);
            const response = await axios.get(`${API_URL}/stability/study/${id}`);
            if (response.data.success) {
                setSelectedStudy(response.data);
            }
        } catch (error) {
            console.error('Error fetching study details:', error);
        }
    };

    const handlePredict = async () => {
        if (!selectedStudy) return;
        try {
            const response = await axios.get(`${API_URL}/stability/study/${selectedStudy.study.id}/predict`);
            if (response.data.success) {
                if (response.data.prediction) {
                    setPrediction(response.data.prediction);
                } else {
                    alert('Insufficient data for prediction. Need at least 2 timepoints with Assay results to calculate degradation vector.');
                }
            }
        } catch (error) {
            console.error('Error predicting shelf life:', error);
            alert('Prediction engine error. Please check server logs.');
        }
    };

    const handleCreateStudy = async () => {
        try {
            const response = await axios.post(`${API_URL}/stability/studies`, newStudy);
            if (response.data.success) {
                setShowAddStudy(false);
                fetchStudies();
            }
        } catch (error) {
            console.error('Error creating study:', error);
        }
    };

    const handleSimulateData = async () => {
        if (!selectedStudy || !selectedStudy.timepoints) return;

        const condition = selectedStudy.study.storage_conditions;

        // Arrhenius-based degradation rates per ICH Q1A storage conditions
        // Long-term (25°C/60%RH): slow; Intermediate (30°C/65%RH): ~2× faster;
        // Accelerated (40°C/75%RH): ~4× faster (Q10 ≈ 2 per 10°C rise)
        const degradationProfiles = {
            '25C/60RH': { rateMin: 0.08, rateMax: 0.16, impBase: 0.08, impRate: 0.10, label: 'Long-Term' },
            '30C/65RH': { rateMin: 0.18, rateMax: 0.28, impBase: 0.10, impRate: 0.18, label: 'Intermediate' },
            '40C/75RH': { rateMin: 0.38, rateMax: 0.55, impBase: 0.15, impRate: 0.35, label: 'Accelerated' },
        };

        const profile = degradationProfiles[condition] || degradationProfiles['25C/60RH'];

        // Randomise degradation rate within the profile band
        const degradationRate = profile.rateMin + Math.random() * (profile.rateMax - profile.rateMin);

        // Randomise T=0 assay in a realistic pharmaceutical range (98.5 – 101.5%)
        const initialAssay = 98.5 + Math.random() * 3.0;

        // Analytical noise: ±0.15% RSD (typical HPLC precision per ICH Q2)
        const hplcRSD = 0.15;

        const confirmSim = window.confirm(
            `Simulate ${profile.label} degradation (${condition})?\n` +
            `Rate: ~${degradationRate.toFixed(3)}%/month | T₀ Assay: ~${initialAssay.toFixed(1)}%\n\n` +
            `Timepoints: T=0, 3, 6, 12, 18, 24 months (ICH Q1A schedule)`
        );
        if (!confirmSim) return;

        try {
            const timepointsToSimulate = selectedStudy.timepoints.filter(tp =>
                [0, 3, 6, 12, 18, 24].includes(tp.planned_interval_months)
            );

            for (const tp of timepointsToSimulate) {
                const months = tp.planned_interval_months;

                // Gaussian-like noise scaled to HPLC RSD
                const assayNoise = (Math.random() + Math.random() - 1) * hplcRSD;
                const impNoise = (Math.random() + Math.random() - 1) * (hplcRSD * 0.5);

                const assayValue = parseFloat((initialAssay - (degradationRate * months) + assayNoise).toFixed(1));
                const impurityValue = parseFloat(Math.max(0, profile.impBase + (profile.impRate * months) + impNoise).toFixed(2));

                const resultsPayload = [
                    {
                        parameter_name: 'Assay',
                        measured_value: assayValue,
                        unit: '%',
                        limit_min: 95.0,
                        limit_max: 105.0,
                        analyst: 'AI_SIMULATOR',
                        notes: `${profile.label} simulation — rate ${degradationRate.toFixed(3)}%/mo`
                    },
                    {
                        parameter_name: 'Total Impurities',
                        measured_value: impurityValue,
                        unit: '%',
                        limit_min: 0,
                        limit_max: 2.0,
                        analyst: 'AI_SIMULATOR',
                        notes: `${profile.label} simulation`
                    }
                ];

                await axios.post(`${API_URL}/stability/timepoint/${tp.id}/results`, resultsPayload);
            }

            alert(`Simulation complete (${profile.label} — ${degradationRate.toFixed(3)}%/month). Refreshing...`);
            fetchStudyDetails(selectedStudy.study.id);

        } catch (error) {
            console.error('Simulation error:', error);
            alert('Failed to simulate data.');
        }
    };


    // Helper to format chart data
    const getChartData = () => {
        if (!selectedStudy || !selectedStudy.timepoints) return [];

        // Group results by interval
        const data = selectedStudy.timepoints.map(tp => {
            const assayResult = tp.results.find(r => r.parameter_name === 'Assay');
            const totalImpResult = tp.results.find(r => r.parameter_name === 'Total Impurities');

            return {
                months: tp.planned_interval_months,
                assay: assayResult ? assayResult.measured_value : null,
                impurities: totalImpResult ? totalImpResult.measured_value : null
            };
        }).filter(d => d.assay !== null || d.impurities !== null);

        return data;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Predictive Intelligence Header */}
            <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl p-8 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Activity className="text-blue-400" size={32} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase mb-2">Predictive Telemetry</h3>
                            <h1 className="text-3xl font-black text-white tracking-tight">Stability Monitoring</h1>
                            <p className="text-slate-400 text-sm mt-1 font-medium italic">Advanced shelf-life forecasting & degradation vector analysis</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddStudy(true)}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20 border border-blue-400/20"
                    >
                        <Plus size={18} />
                        Initialize New Protocol
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-12 gap-8">
                {/* Active Protocols List */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Active Protocols</h3>
                        <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-slate-400 uppercase">
                            N = {studies.length}
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {studies.map(study => (
                            <motion.div
                                key={study.id}
                                whileHover={{ x: 8, scale: 1.01 }}
                                onClick={() => fetchStudyDetails(study.id)}
                                className={`p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${selectedStudy?.study.id === study.id
                                    ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.15)] outline outline-1 outline-blue-500/50'
                                    : 'bg-slate-900/40 border-white/5 hover:border-white/10 backdrop-blur-md'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <h4 className="font-black text-white text-lg tracking-tight group-hover:text-blue-400 transition-colors uppercase">{study.product_name}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Monitoring Active</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[9px] font-black bg-white/5 px-2.5 py-1 rounded-xl border border-white/5 text-slate-300 uppercase tracking-widest backdrop-blur-md">
                                                {study.storage_conditions}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
                                                        axios.delete(`${API_URL}/stability/study/${study.id}`)
                                                            .then(() => fetchStudies())
                                                            .catch(err => console.error(err));
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                            <Beaker size={12} className="text-blue-500 opacity-60" />
                                            <span className="text-slate-400">{study.batch_number}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                            <Calendar size={12} className="text-slate-500 opacity-60" />
                                            <span className="text-slate-400">{new Date(study.start_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Analytical Protocol View */}
                <div className="col-span-12 lg:col-span-8">
                    {selectedStudy ? (
                        <div className="space-y-8">
                            {/* Trend/Degradation Visualization */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full" />

                                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mb-2 flex items-center gap-2">
                                            <TrendingUp className="text-emerald-400" size={16} />
                                            Degradation Linear Vector
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">{selectedStudy.study.product_name}</h2>
                                            <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                                BT: {selectedStudy.study.batch_number}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                                            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 text-blue-400">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> Assay %
                                            </div>
                                            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 text-amber-400">
                                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Residual Impurities
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSimulateData}
                                            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                                        >
                                            <Activity size={14} />
                                            Simulate Data
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handlePredict}
                                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                        >
                                            <Beaker size={14} />
                                            Predict Lifecycle
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="h-[350px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={getChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.1} />
                                            <XAxis
                                                dataKey="months"
                                                stroke="#475569"
                                                fontSize={10}
                                                fontWeight={700}
                                                axisLine={false}
                                                tickLine={false}
                                                label={{ value: 'INTERVAL (MONTHS)', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}
                                            />
                                            <YAxis
                                                yId="left"
                                                stroke="#3b82f6"
                                                fontSize={10}
                                                fontWeight={700}
                                                axisLine={false}
                                                domain={[90, 105]}
                                                label={{ value: 'ASSAY %', angle: -90, position: 'insideLeft', offset: 10, fill: '#3b82f6', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}
                                            />
                                            <YAxis
                                                yId="right"
                                                orientation="right"
                                                stroke="#f59e0b"
                                                fontSize={10}
                                                fontWeight={700}
                                                axisLine={false}
                                                domain={[0, 5]}
                                                label={{ value: 'IMPURITIES %', angle: 90, position: 'insideRight', offset: 10, fill: '#f59e0b', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', backdropFilter: 'blur(12px)' }}
                                                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                            <ReferenceLine yId="left" y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'LCL (95%)', position: 'right', fill: '#ef4444', fontSize: 9, fontWeight: 900 }} />
                                            <Line yId="left" type="monotone" dataKey="assay" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
                                            {prediction && (
                                                <Line
                                                    yId="left"
                                                    type="monotone"
                                                    data={prediction.regression_line}
                                                    dataKey="predicted_assay"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    strokeDasharray="6 6"
                                                    dot={false}
                                                    name="Predicted Vector"
                                                />
                                            )}
                                            <Line yId="right" type="monotone" dataKey="impurities" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {prediction && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6"
                                    >
                                        {[
                                            { label: 'Forecasted Lifespan (t95)', value: `${prediction.predicted_t95} MO`, icon: Clock, color: 'emerald', desc: 'ICH Q1E SHELF LIFE' },
                                            { label: 'Degradation Gradient', value: `${prediction.slope}% / MO`, icon: TrendingUp, color: 'amber', desc: 'LINEAR DECAY RATE' },
                                            { label: 'Regression Fit (R²)', value: prediction.r_squared ?? 'N/A', icon: Activity, color: 'blue', desc: 'OLS GOODNESS OF FIT' }
                                        ].map((stat) => (
                                            <div key={stat.label} className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                                                    {stat.label}
                                                    <stat.icon size={12} className={`text-${stat.color}-400`} />
                                                </div>
                                                <div className="text-2xl font-black text-white font-mono tracking-tighter mb-1">{stat.value}</div>
                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{stat.desc}</div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Chronological Sequence Archive */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase flex items-center gap-2">
                                        <Calendar className="text-blue-400" size={16} />
                                        Sequence Chronology Table
                                    </h3>
                                    <div className="px-3 py-1 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                        Compliance Matrix Active
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">
                                                <th className="py-5 px-8">Temporal Anchor</th>
                                                <th className="py-5 px-8">Operational Flux</th>
                                                <th className="py-5 px-8">Registered Date</th>
                                                <th className="py-5 px-8">Assay Density (%)</th>
                                                <th className="py-5 px-8">Integrity Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedStudy.timepoints.map(tp => {
                                                const assay = tp.results.find(r => r.parameter_name === 'Assay');
                                                const isCompleted = tp.status === 'COMPLETED';
                                                return (
                                                    <tr key={tp.id} className="text-[11px] font-bold text-slate-300 hover:bg-white/5 transition-colors group">
                                                        <td className="py-5 px-8 font-black tracking-widest text-white uppercase opacity-80">T={tp.planned_interval_months}M</td>
                                                        <td className="py-5 px-8">
                                                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black tracking-widest ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                                                                }`}>
                                                                {tp.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-8 text-slate-500 font-mono">
                                                            {new Date(tp.planned_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-5 px-8 font-mono text-white">
                                                            {assay ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${assay.measured_value >= 95 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                    {assay.measured_value}%
                                                                </div>
                                                            ) : '---'}
                                                        </td>
                                                        <td className="py-5 px-8">
                                                            {assay ? (
                                                                assay.measured_value >= 95 ? (
                                                                    <div className="flex items-center gap-2 text-emerald-400 uppercase tracking-widest text-[9px] font-black">
                                                                        <CheckCircle size={14} /> Pass ≥95%
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-red-400 uppercase tracking-widest text-[9px] font-black">
                                                                        <AlertCircle size={14} /> OOS &lt;95%
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="text-slate-600 uppercase tracking-widest text-[9px] font-black opacity-40 italic">Pending</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-[2.5rem] p-12 bg-slate-900/20 backdrop-blur-sm">
                            <div className="p-6 bg-blue-500/5 rounded-full mb-6 border border-blue-500/10 animate-pulse">
                                <BarChart2 size={48} className="opacity-20 text-blue-400" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Protocol Unselected</h4>
                            <p className="text-xs text-slate-600 font-medium italic">Initialize a data stream to begin predictive analysis</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: New Protocol Initialization */}
            {showAddStudy && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-900 border border-white/5 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 relative"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full" />

                        <div className="relative mb-10">
                            <h3 className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase mb-2">System Config</h3>
                            <h2 className="text-3xl font-black text-white tracking-tight">New Stability Protocol</h2>
                        </div>

                        <div className="relative space-y-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-blue-400 transition-colors">Product Identification</label>
                                <input
                                    type="text"
                                    value={newStudy.product_name}
                                    onChange={e => setNewStudy({ ...newStudy, product_name: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700"
                                    placeholder="e.g., CORTEX-OMEGA 500 MG"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-blue-400 transition-colors">Batch Vector</label>
                                    <input
                                        type="text"
                                        value={newStudy.batch_number}
                                        onChange={e => setNewStudy({ ...newStudy, batch_number: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-mono font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                                        placeholder="BN-X109"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-blue-400 transition-colors">Storage Flux</label>
                                    <select
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                        value={newStudy.storage_conditions}
                                        onChange={e => setNewStudy({ ...newStudy, storage_conditions: e.target.value })}
                                    >
                                        <option value="25C/60RH">25°C / 60% RH [CRT]</option>
                                        <option value="30C/65RH">30°C / 65% RH [INT]</option>
                                        <option value="40C/75RH">40°C / 75% RH [ACC]</option>
                                    </select>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-blue-400 transition-colors">Initialize Temporal Anchor</label>
                                <input
                                    type="date"
                                    value={newStudy.start_date}
                                    onChange={e => setNewStudy({ ...newStudy, start_date: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-mono font-bold focus:outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    onClick={() => setShowAddStudy(false)}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleCreateStudy}
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20"
                                >
                                    Deploy Protocol
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

export default StabilityMonitor;
