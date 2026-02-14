import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Shield, CheckCircle, AlertCircle, TrendingUp, Sliders,
    Target, FileText, Microscope, Plus, X, RefreshCw, Database
} from 'lucide-react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ReferenceArea, ReferenceLine
} from 'recharts';

const API_URL = 'http://localhost:5000/api';

function QbDDashboard() {
    const [activeTab, setActiveTab] = useState('design-space');
    const [cqas, setCqas] = useState([]);
    const [cpps, setCpps] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [controlStrategy, setControlStrategy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // New Experiment Form State
    const [showAddExperiment, setShowAddExperiment] = useState(false);
    const [newExp, setNewExp] = useState({
        experiment_name: '',
        experiment_type: 'DOE',
        temperature: 40,
        duration: 24,
        ph: 7.0,
        oxidizer_conc: 0,
        stress_type: 'thermal',
        measured_cimb: 100,
        measured_degradation: 0,
        measured_unknowns: 0,
        measured_ci: 95,
        meets_cqa: true,
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cqasRes, cppsRes, expsRes, csRes] = await Promise.all([
                axios.get(`${API_URL}/qbd/cqas`),
                axios.get(`${API_URL}/qbd/process-parameters`),
                axios.get(`${API_URL}/qbd/design-space`),
                axios.get(`${API_URL}/qbd/control-strategy`)
            ]);

            if (cqasRes.data.success) setCqas(cqasRes.data.cqas);
            if (cppsRes.data.success) setCpps(cppsRes.data.parameters);
            if (expsRes.data.success) setExperiments(expsRes.data.experiments);
            if (csRes.data.success) setControlStrategy(csRes.data.strategy);
        } catch (error) {
            console.error('Error fetching QbD data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLimsSync = async () => {
        setSyncing(true);
        try {
            const response = await axios.post(`${API_URL}/qbd/lims-sync`, {
                system_name: 'thermo_watson',
                query: { status: 'COMPLETE' }
            });

            if (response.data.success) {
                alert(`Successfully synchronized ${response.data.samples.length} samples from LIMS.`);
                fetchData();
            }
        } catch (error) {
            console.error('LIMS sync error:', error);
            alert('Failed to sync with LIMS');
        } finally {
            setSyncing(false);
        }
    };

    const handleAddExperiment = async () => {
        try {
            const response = await axios.post(`${API_URL}/qbd/design-space`, newExp);
            if (response.data.success) {
                setShowAddExperiment(false);
                fetchData(); // Refresh data
                // Reset form
                setNewExp({
                    experiment_name: '',
                    experiment_type: 'DOE',
                    temperature: 40,
                    duration: 24,
                    ph: 7.0,
                    oxidizer_conc: 0,
                    stress_type: 'thermal',
                    measured_cimb: 100,
                    measured_degradation: 0,
                    measured_unknowns: 0,
                    measured_ci: 95,
                    meets_cqa: true,
                    notes: ''
                });
            }
        } catch (error) {
            console.error('Error adding experiment:', error);
            alert('Failed to add experiment');
        }
    };

    // Custom Tooltip for Design Space Chart
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-white mb-1">{data.experiment_name}</p>
                    {data.experiment_type === 'VALIDATION' && (
                        <p className="text-blue-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                            <Database size={10} /> LIMS Sourced
                        </p>
                    )}
                    <p className="text-slate-300">Temp: {data.temperature}°C</p>
                    <p className="text-slate-300">Duration: {data.duration}h</p>
                    <p className="text-slate-300">CIMB: {data.measured_cimb}%</p>
                    <p className={`font-bold mt-1 ${data.meets_cqa ? 'text-green-400' : 'text-red-400'}`}>
                        {data.meets_cqa ? 'PASS' : 'FAIL'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <Shield className="text-emerald-400" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">QbD Framework</h2>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Quality by Design: Design Space, Control Strategy, and CQA Monitoring
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleLimsSync}
                            disabled={syncing}
                            className={`px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-all border border-slate-700 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Syncing...' : 'Sync with LIMS'}
                        </button>
                        <button
                            onClick={() => setShowAddExperiment(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} />
                            Add Experiment
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-1">
                {[
                    { id: 'design-space', label: 'Design Space', icon: Target },
                    { id: 'control-strategy', label: 'Control Strategy', icon: Sliders },
                    { id: 'cqas', label: 'CQAs & CPPs', icon: Microscope },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 rounded-t-lg font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">

                {/* DESIGN SPACE TAB */}
                {activeTab === 'design-space' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">

                            {/* Chart */}
                            <div className="col-span-2 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-emerald-400" />
                                    Design Space Visualization
                                </h3>

                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis
                                                type="number"
                                                dataKey="temperature"
                                                name="Temperature"
                                                unit="°C"
                                                stroke="#94a3b8"
                                                domain={[20, 80]}
                                            />
                                            <YAxis
                                                type="number"
                                                dataKey="duration"
                                                name="Duration"
                                                unit="h"
                                                stroke="#94a3b8"
                                                domain={[0, 168]}
                                            />
                                            <ZAxis type="number" dataKey="measured_cimb" range={[50, 400]} name="CIMB" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />

                                            {/* Design Space Box */}
                                            <ReferenceArea
                                                x1={40} x2={60} y1={24} y2={72}
                                                stroke="none" fill="#10b981" fillOpacity={0.1}
                                            />

                                            <Scatter
                                                name="DOE Passing"
                                                data={experiments.filter(e => e.experiment_type !== 'VALIDATION' && e.meets_cqa)}
                                                fill="#10b981"
                                                shape="circle"
                                            />
                                            <Scatter
                                                name="DOE Failing"
                                                data={experiments.filter(e => e.experiment_type !== 'VALIDATION' && !e.meets_cqa)}
                                                fill="#ef4444"
                                                shape="cross"
                                            />
                                            <Scatter
                                                name="LIMS Passing"
                                                data={experiments.filter(e => e.experiment_type === 'VALIDATION' && e.meets_cqa)}
                                                fill="#3b82f6"
                                                shape="diamond"
                                            />
                                            <Scatter
                                                name="LIMS Alert"
                                                data={experiments.filter(e => e.experiment_type === 'VALIDATION' && !e.meets_cqa)}
                                                fill="#f59e0b"
                                                shape="triangle"
                                            />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 flex justify-center gap-6 text-[10px] text-slate-500">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> DOE Passed</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> DOE Failed</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rotate-45" style={{ width: 6, height: 6 }} /> LIMS Passed</div>
                                    <div className="flex items-center gap-1"><div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-amber-500" /> LIMS Alert</div>
                                </div>
                                <div className="mt-2 text-center text-xs text-slate-500">
                                    Green Area represents the Proven Acceptable Range (PAR)
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="text-sm text-slate-400 mb-1">Total Experiments</div>
                                    <div className="text-3xl font-bold text-white">{experiments.length}</div>
                                </div>

                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="text-sm text-slate-400 mb-1">Success Rate</div>
                                    <div className="text-3xl font-bold text-emerald-400">
                                        {experiments.length > 0
                                            ? Math.round((experiments.filter(e => e.meets_cqa).length / experiments.length) * 100)
                                            : 0}%
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="text-sm text-slate-400 mb-1">Knowledge Space Coverage</div>
                                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-blue-500 h-full w-[65%]" />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>Current</span>
                                        <span>65% Target</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Experiment List */}
                        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                            <h3 className="text-lg font-bold text-white mb-4">Recent Experiments</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-800 text-sm">
                                            <th className="py-3 px-4">Name</th>
                                            <th className="py-3 px-4">Type</th>
                                            <th className="py-3 px-4">Conditions</th>
                                            <th className="py-3 px-4">Metrics (CIMB / Deg / CI)</th>
                                            <th className="py-3 px-4">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-slate-300">
                                        {experiments.map((exp) => (
                                            <tr key={exp.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="py-3 px-4 font-medium">{exp.experiment_name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 rounded-full bg-slate-800 text-xs border border-slate-700">
                                                        {exp.experiment_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {exp.temperature}°C, {exp.duration}h, {exp.stress_type}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {exp.measured_cimb}% / {exp.measured_degradation}% / {exp.measured_ci}%
                                                </td>
                                                <td className="py-3 px-4">
                                                    {exp.meets_cqa ? (
                                                        <span className="text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle size={14} /> Pass
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-400 flex items-center gap-1">
                                                            <AlertCircle size={14} /> Fail
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTROL STRATEGY TAB */}
                {activeTab === 'control-strategy' && (
                    <div className="grid grid-cols-2 gap-6">
                        {controlStrategy.map((cs) => (
                            <div key={cs.id} className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {cs.control_type}
                                        </span>
                                        <h4 className="text-lg font-bold text-white mt-2">{cs.parameter_controlled}</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">Responsible Role</div>
                                        <div className="text-sm text-slate-300">{cs.responsible_role}</div>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                        <span className="text-slate-500">Control Method</span>
                                        <span className="text-slate-300">{cs.control_method}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                        <span className="text-slate-500">Acceptance Criteria</span>
                                        <span className="text-emerald-400 font-mono">{cs.acceptance_criteria}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                        <span className="text-slate-500">Monitoring Freq</span>
                                        <span className="text-slate-300">{cs.monitoring_frequency}</span>
                                    </div>
                                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 mt-4">
                                        <div className="text-xs text-red-400 font-bold mb-1">Escalation Procedure:</div>
                                        <div className="text-xs text-red-300">{cs.escalation_procedure}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CQAs & CPPs TAB */}
                {activeTab === 'cqas' && (
                    <div className="space-y-8">
                        {/* CQAs Section */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Critical Quality Attributes (CQAs)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cqas.map((cqa) => (
                                    <div key={cqa.id} className="p-5 bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${cqa.criticality === 'HIGH' ? 'bg-red-500' :
                                            cqa.criticality === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`} />

                                        <div className="pl-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white">{cqa.name}</h4>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${cqa.criticality === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {cqa.criticality}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1 mb-3">{cqa.description}</p>

                                            <div className="bg-slate-800/50 p-3 rounded-lg text-sm border border-slate-700/50">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-slate-500">Target:</span>
                                                    <span className="text-white">{cqa.target_value ?? 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Range:</span>
                                                    <span className="text-white font-mono">{cqa.lower_limit} - {cqa.upper_limit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CPPs Section */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Critical Process Parameters (CPPs)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cpps.map((cpp) => (
                                    <div key={cpp.id} className="p-5 bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${cpp.criticality === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'
                                            }`} />

                                        <div className="pl-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white">{cpp.parameter_name}</h4>
                                                <span className="text-xs text-slate-500">{cpp.unit}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1 mb-3">{cpp.description}</p>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20 text-center">
                                                    <div className="text-emerald-500 font-bold mb-1">Operating Range</div>
                                                    <div className="text-white">{cpp.normal_operating_range_min} - {cpp.normal_operating_range_max}</div>
                                                </div>
                                                <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20 text-center">
                                                    <div className="text-blue-500 font-bold mb-1">Proven Range</div>
                                                    <div className="text-white">{cpp.proven_acceptable_range_min} - {cpp.proven_acceptable_range_max}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Add Experiment Modal */}
            {showAddExperiment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">Add Design Space Experiment</h3>
                            <button onClick={() => setShowAddExperiment(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm text-slate-300">Experiment Name</span>
                                    <input
                                        type="text"
                                        value={newExp.experiment_name}
                                        onChange={e => setNewExp({ ...newExp, experiment_name: e.target.value })}
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm text-slate-300">Type</span>
                                    <select
                                        value={newExp.experiment_type}
                                        onChange={e => setNewExp({ ...newExp, experiment_type: e.target.value })}
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="DOE">DOE</option>
                                        <option value="EDGE_OF_FAILURE">Edge of Failure</option>
                                        <option value="ROBUSTNESS">Robustness</option>
                                    </select>
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <label className="block">
                                    <span className="text-sm text-slate-300">Temp (°C)</span>
                                    <input type="number" value={newExp.temperature} onChange={e => setNewExp({ ...newExp, temperature: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                                </label>
                                <label className="block">
                                    <span className="text-sm text-slate-300">Duration (h)</span>
                                    <input type="number" value={newExp.duration} onChange={e => setNewExp({ ...newExp, duration: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                                </label>
                                <label className="block">
                                    <span className="text-sm text-slate-300">pH</span>
                                    <input type="number" step="0.1" value={newExp.ph} onChange={e => setNewExp({ ...newExp, ph: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                                </label>
                            </div>

                            <div className="border-t border-slate-800 pt-4 mt-2">
                                <h4 className="text-sm font-bold text-slate-400 mb-3">Measured Results</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-sm text-slate-300">CIMB (%)</span>
                                        <input type="number" step="0.1" value={newExp.measured_cimb} onChange={e => setNewExp({ ...newExp, measured_cimb: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-slate-300">Degradation (%)</span>
                                        <input type="number" step="0.1" value={newExp.measured_degradation} onChange={e => setNewExp({ ...newExp, measured_degradation: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="meets_cqa"
                                    checked={newExp.meets_cqa}
                                    onChange={e => setNewExp({ ...newExp, meets_cqa: e.target.checked })}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                                />
                                <label htmlFor="meets_cqa" className="text-sm text-white">Meets All CQA Acceptance Criteria</label>
                            </div>

                            <button
                                onClick={handleAddExperiment}
                                className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold transition-colors"
                            >
                                Save Experiment Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default QbDDashboard;
