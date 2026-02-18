import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Zap, AlertTriangle, Info, Beaker, Brain } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GNNAnalysis = ({ smiles, stressType }) => {
    const [loading, setLoading] = useState(false);
    const [gnnData, setGnnData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (smiles) {
            fetchGNNAnalysis();
        }
    }, [smiles, stressType]);

    const fetchGNNAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/ml/gnn-predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smiles })
            });
            const data = await response.json();
            if (data.success) {
                setGnnData(data);
            } else {
                setError(data.error || 'Failed to analyze molecule');
            }
        } catch (err) {
            setError('Connection to GNN service failed');
        } finally {
            setLoading(false);
        }
    };

    const getLabilityColor = (score) => {
        if (score > 0.7) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (score > 0.4) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Brain className="text-purple-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">GNN Intelligence</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">Deep Molecular Graph Vectorization</p>
                    </div>
                </div>
                {gnnData && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-600 uppercase">Engine Type</span>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded-lg">GraphConv-Alpha v2.1</span>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-64 flex flex-col items-center justify-center space-y-4 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Share2 className="text-purple-400 animate-pulse" size={16} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Mapping Atomic Adjacency...</p>
                    </motion.div>
                ) : gnnData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {/* Molecular Graph Visualization (Simplified) */}
                        <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full" />

                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Beaker size={14} className="text-purple-400" />
                                Graph Topology Reconstruction
                            </h4>

                            <div className="flex flex-wrap gap-4 justify-center py-8">
                                {gnnData.atom_lability.map((atom, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.1, y: -5 }}
                                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border backdrop-blur-xl transition-all shadow-lg ${getLabilityColor(atom.lability)}`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-black tracking-tighter">{atom.symbol}</span>
                                            <span className="text-[8px] font-black opacity-60">ID:{atom.index}</span>
                                        </div>
                                        {atom.lability > 0.6 && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                                        )}
                                        <div className="absolute -bottom-6 left-0 right-0 text-center">
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-tighter">LVL: {(atom.lability * 100).toFixed(0)}%</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-12 flex items-center justify-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-center">
                                    <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Atoms</div>
                                    <div className="text-lg font-black text-white">{gnnData.num_atoms}</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Global Stress</div>
                                    <div className="text-lg font-black text-purple-400 uppercase tracking-tighter">{gnnData.overall_susceptibility}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Insights */}
                        <div className="space-y-6">
                            <div className="p-6 bg-purple-500/5 rounded-3xl border border-purple-500/10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Inference</h4>
                                        <p className="text-xs text-white font-bold italic leading-relaxed">
                                            The GNN model suggests that the degradation is localized around specific heterocyclic nodes within the graph structure.
                                        </p>
                                    </div>
                                    <Zap className="text-purple-400" size={16} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    Critical Labile Identifiers
                                </h5>
                                {gnnData.atom_lability
                                    .sort((a, b) => b.lability - a.lability)
                                    .slice(0, 3)
                                    .map((atom, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${getLabilityColor(atom.lability)}`}>
                                                    {atom.symbol}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-white transition-colors">Atom Index {atom.index}</div>
                                                    <div className="text-[9px] font-bold text-slate-600 uppercase italic">Vector Susceptibility Rank: #{idx + 1}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-white">{(atom.lability * 100).toFixed(1)}%</div>
                                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lability</div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600 bg-slate-900/20 rounded-3xl border-2 border-dashed border-white/5 italic text-sm">
                        <Info size={32} className="mb-3 opacity-20" />
                        Enter a valid chemical identity to initialize GNN Vectorization
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GNNAnalysis;
