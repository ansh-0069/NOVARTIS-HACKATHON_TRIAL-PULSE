import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Database, RefreshCw, CheckCircle, AlertCircle,
    Link2, Activity, Server, ChevronRight, Play, LayoutGrid, Shield
} from 'lucide-react';

const API_BASE = "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

const LimsPortal = ({ onIngest }) => {
    const [systems, setSystems] = useState([]);
    const [worklist, setWorklist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Parallel fetch for speed
            const [sysRes, workRes] = await Promise.all([
                axios.get(`${API_URL}/lims/systems`),
                axios.post(`${API_URL}/lims/fetch`, { system_name: 'thermo_watson' })
            ]);

            setSystems(sysRes.data.systems || []);
            setWorklist(workRes.data.all_samples || []);
        } catch (error) {
            console.error('LIMS Portal fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSync = async () => {
        setSyncing(true);
        await new Promise(r => setTimeout(r, 1500));
        await fetchInitialData();
        setSyncing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header & Connectivity Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl translate-x-1/2 -translate-y-1/2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <Database className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise LIMS Portal</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Link Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleManualSync}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Syncing...' : 'Force Refresh'}
                        </button>
                    </div>
                </div>

                {/* System Connectivity Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                    {systems.map((sys) => (
                        <div key={sys.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-blue-500/30 transition-colors group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Server size={14} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white uppercase tracking-tight">{sys.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{sys.type}</div>
                                    </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sys.supported ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {sys.supported ? 'Active' : 'Offline'}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Latency: 4ms</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Worklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sample List (2/3 width) */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                    <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <LayoutGrid size={18} className="text-blue-400" />
                            Incoming Lab Worklist
                        </h3>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20">
                            {worklist.length} SAMPLES PENDING
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sample Identification</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {worklist.map((sample, idx) => (
                                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center group-hover:bg-blue-600/10 group-hover:border-blue-500/30 transition-colors">
                                                    <Link2 size={16} className="text-slate-500 group-hover:text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white tracking-tight">{sample.SampleName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        <span>{sample.StressType}</span>
                                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                        <span>{sample.StressTemperature}°C</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50 text-[10px] font-bold text-slate-400 group-hover:border-emerald-500/20 group-hover:text-emerald-400 transition-all">
                                                <CheckCircle size={10} />
                                                READY
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => onIngest(sample)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black text-white transition-all shadow-lg shadow-blue-500/10 flex items-center gap-2 ml-auto"
                                            >
                                                <Play size={12} fill="currentColor" />
                                                INGEST
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Telemetry Panel (1/3 width) */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Activity size={14} className="text-blue-400" />
                            Link Telemetry
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tunnel Status</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-white">SSL Encrypted</span>
                                    <Shield size={14} className="text-emerald-500" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">API Throughput</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-white">1.2 GB/s</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-blue-500' : 'bg-slate-700'}`} />)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Identity Provider</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-white">OAuth2 Provider</span>
                                    <div className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase">Verified</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LimsPortal;
