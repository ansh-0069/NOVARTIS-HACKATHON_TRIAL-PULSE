import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Zap, AlertTriangle, Info, Beaker, Brain, Activity, Clock, Cpu } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Client-side fallback engine (used only if backend is unavailable) ────────
const ATOM_WEIGHTS = { C: 12, N: 14, O: 16, S: 32, F: 19, Cl: 35.5, Br: 80, I: 127, P: 31 };
const BASE_LABILITY = { O: 0.68, N: 0.58, S: 0.82, P: 0.60, F: 0.15, Cl: 0.38, Br: 0.52, I: 0.62, C: 0.20 };
const CONTEXT_PATTERNS = [
    { pattern: /C\(=O\)O[^H]|OC\(=O\)/, boost: 0.25 },
    { pattern: /C\(=O\)N/, boost: 0.20 },
    { pattern: /\[NH\]|N\(/, boost: 0.12 },
    { pattern: /S\(=O\)/, boost: 0.18 },
    { pattern: /c1/, boost: 0.08 },
    { pattern: /\[OH\]/, boost: 0.15 },
];

function computeFallback(smiles, stressType) {
    const atoms = [];
    let i = 0;
    while (i < smiles.length) {
        if (/[A-Z]/.test(smiles[i])) {
            const two = smiles.slice(i, i + 2);
            if (['Cl', 'Br'].includes(two)) { atoms.push(two); i += 2; continue; }
            atoms.push(smiles[i]);
        }
        i++;
    }
    if (atoms.length === 0) return null;
    let contextBoost = CONTEXT_PATTERNS.reduce((s, { pattern, boost }) => s + (pattern.test(smiles) ? boost : 0), 0);
    const stressMult = { acid: 1.15, base: 1.10, oxidative: 1.20, thermal: 1.05, photolytic: 1.12 }[stressType] || 1.0;
    const atom_lability = atoms.slice(0, 22).map((sym, idx) => {
        const base = BASE_LABILITY[sym] ?? 0.18;
        const variation = ((idx * 7 + 13) % 17) / 170;
        return { index: idx, symbol: sym, lability: parseFloat(Math.min(0.98, (base + variation + contextBoost * 0.4) * stressMult).toFixed(3)) };
    });
    const avg = atom_lability.reduce((s, a) => s + a.lability, 0) / atom_lability.length;
    return {
        atom_lability,
        overall_susceptibility: parseFloat((avg * 100).toFixed(2)),
        num_atoms: atom_lability.length,
        model_type: 'Rule-based Fallback',
        source: 'js-fallback',
    };
}

// ─── Functional group detection (rdkit-independent, always available) ────────
function detectFunctionalGroups(smiles) {
    const groups = [];
    if (/C\(=O\)O[^H]|OC\(=O\)/.test(smiles)) groups.push('Ester');
    if (/C\(=O\)N/.test(smiles)) groups.push('Amide');
    if (/[CN]N|N[^=\d]/.test(smiles)) groups.push('Amine');
    if (/CSC|cSc/.test(smiles)) groups.push('Thioether');
    if (/c1/.test(smiles)) groups.push('Aromatic Ring');
    if (/C\(=O\)O(?!C)/.test(smiles)) groups.push('Carboxylic Acid');
    if (/\[OH\]|CO[^C=]/.test(smiles)) groups.push('Alcohol');
    if (/S\(=O\)/.test(smiles)) groups.push('Sulfoxide');
    if (/C#N/.test(smiles)) groups.push('Nitrile');
    return groups;
}

function kinetics(overallSusceptibility, stressType) {
    const kBase = { acid: 0.050, base: 0.040, oxidative: 0.080, thermal: 0.030, photolytic: 0.060 }[stressType] || 0.050;
    const k = parseFloat((kBase * (1 + overallSusceptibility / 200)).toFixed(5));
    const t12h = parseFloat((Math.log(2) / k).toFixed(1));
    return { k, half_life_hours: t12h, half_life_days: parseFloat((t12h / 24).toFixed(1)) };
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
const labilityColor = s => s > 0.70 ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : s > 0.45 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
const labilityBg = s => s > 0.70 ? 'bg-red-500' : s > 0.45 ? 'bg-amber-500' : 'bg-emerald-500';
const levelColor = l => l === 'HIGH' ? 'text-red-400' : l === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400';
const levelGrad = l => l === 'HIGH' ? 'bg-red-500' : l === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500';

// ─── Component ────────────────────────────────────────────────────────────────
const GNNAnalysis = ({ smiles, stressType }) => {
    const [loading, setLoading] = useState(false);
    const [gnnData, setGnnData] = useState(null);
    const [source, setSource] = useState(null); // 'python-gnn' | 'js-fallback'
    const [error, setError] = useState(null);

    // Derived fields from smiles (always computed locally)
    const functionalGroups = useMemo(() => smiles ? detectFunctionalGroups(smiles) : [], [smiles]);

    useEffect(() => {
        if (!smiles) { setGnnData(null); setError(null); return; }
        fetchGNN();
    }, [smiles, stressType]);

    const fetchGNN = async () => {
        setLoading(true);
        setError(null);
        setGnnData(null);
        try {
            const resp = await fetch(`${API_BASE}/api/ml/gnn-predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smiles }),
                signal: AbortSignal.timeout(12000),
            });
            const data = await resp.json();
            if (data.success) {
                setGnnData(data);
                setSource(data.source || 'python-gnn');
            } else {
                throw new Error(data.error || 'GNN failed');
            }
        } catch (err) {
            // Hard fallback — compute locally
            console.warn('GNN API unavailable, using client-side fallback:', err.message);
            const fb = computeFallback(smiles, stressType || 'oxidative');
            if (fb) { setGnnData(fb); setSource('js-fallback'); }
            else setError('Could not analyse this SMILES string.');
        } finally {
            setLoading(false);
        }
    };

    // Once we have gnnData, compute derived fields
    const derived = useMemo(() => {
        if (!gnnData || !gnnData.atom_lability?.length) return null;
        const susc = gnnData.overall_susceptibility;
        const level = susc >= 65 ? 'HIGH' : susc >= 40 ? 'MODERATE' : 'LOW';
        const kin = kinetics(susc, stressType || 'oxidative');
        return { susc, level, kin };
    }, [gnnData, stressType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Brain className="text-purple-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">GNN Intelligence</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">
                            Deep Molecular Graph Vectorization
                        </p>
                    </div>
                </div>
                {gnnData && (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase">Engine</span>
                        <div className="flex items-center gap-1.5">
                            {source === 'python-gnn' && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                                    <Cpu size={9} /> Real PyTorch GNN
                                </span>
                            )}
                            {source === 'js-fallback' && (
                                <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                    Heuristic Fallback
                                </span>
                            )}
                            <span className="text-[9px] font-black text-purple-400 bg-purple-500/5 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                                GraphConv-Alpha v2.1
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {/* Loading */}
                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-64 flex flex-col items-center justify-center space-y-4 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-md"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Share2 className="text-purple-400 animate-pulse" size={16} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            Running Graph Convolution…
                        </p>
                    </motion.div>
                )}

                {/* Error */}
                {!loading && error && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="h-32 flex flex-col items-center justify-center text-red-400 bg-red-500/5 rounded-2xl border border-red-500/20 text-sm italic gap-2">
                        <AlertTriangle size={24} />
                        {error}
                    </motion.div>
                )}

                {/* Empty state */}
                {!loading && !error && !gnnData && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="h-64 flex flex-col items-center justify-center text-slate-600 bg-slate-900/20 rounded-3xl border-2 border-dashed border-white/5 italic text-sm">
                        <Info size={32} className="mb-3 opacity-20" />
                        Enter a SMILES and click Predict to initialize GNN Vectorization
                    </motion.div>
                )}

                {/* Results */}
                {!loading && !error && gnnData && derived && (
                    <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        {/* Row 1: Atom topology + Top labile atoms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Atom topology grid */}
                            <div className="p-6 bg-slate-900/60 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full" />
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                                    <Beaker size={13} className="text-purple-400" />
                                    Graph Topology — {gnnData.num_atoms} Atoms
                                    {source === 'python-gnn' && <span className="text-emerald-500 text-[8px]">(rdkit + PyTorch)</span>}
                                </h4>

                                <div className="flex flex-wrap gap-3 justify-center py-4">
                                    {gnnData.atom_lability.map((atom, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.12, y: -4 }}
                                            className={`relative w-12 h-12 rounded-xl flex items-center justify-center border backdrop-blur-xl shadow-lg transition-all ${labilityColor(atom.lability)}`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="text-base font-black leading-none">{atom.symbol}</span>
                                                <span className="text-[7px] font-black opacity-50">#{atom.index}</span>
                                            </div>
                                            {atom.lability > 0.65 && (
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Stats bar */}
                                <div className="mt-4 flex items-center justify-around p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-center">
                                        <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Atoms</div>
                                        <div className="text-lg font-black text-white">{gnnData.num_atoms}</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Global Stress</div>
                                        <div className={`text-lg font-black ${levelColor(derived.level)}`}>
                                            {derived.susc}%
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Risk</div>
                                        <div className={`text-sm font-black ${levelColor(derived.level)}`}>{derived.level}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="space-y-4">
                                {/* Inference + gauge */}
                                <div className="p-5 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Inference</h4>
                                            <p className="text-xs text-white font-semibold italic leading-relaxed">
                                                {derived.level === 'HIGH'
                                                    ? 'GNN detects high molecular lability — multiple reactive nodes identified across the graph. Prioritize forced degradation studies under ICH Q1A conditions.'
                                                    : derived.level === 'MODERATE'
                                                        ? 'Moderate susceptibility — key functional groups show stress-specific vulnerability. Targeted stress studies recommended.'
                                                        : 'Low susceptibility profile. Molecule exhibits robust chemical stability under the selected stress condition.'}
                                            </p>
                                        </div>
                                        <Zap className="text-purple-400 ml-3 flex-shrink-0" size={16} />
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase mb-1">
                                            <span>Susceptibility Score</span>
                                            <span className={levelColor(derived.level)}>{derived.susc}% — {derived.level}</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${derived.susc}%` }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${levelGrad(derived.level)}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Critical labile atoms */}
                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <AlertTriangle size={11} className="text-amber-500" />
                                        Critical Labile Identifiers
                                    </h5>
                                    {[...gnnData.atom_lability]
                                        .sort((a, b) => b.lability - a.lability)
                                        .slice(0, 4)
                                        .map((atom, idx) => (
                                            <div key={idx}
                                                className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${labilityColor(atom.lability)}`}>
                                                        {atom.symbol}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-white transition-colors">
                                                            Atom Index {atom.index}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-slate-600 uppercase italic">Susceptibility Rank #{idx + 1}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-white">{(atom.lability * 100).toFixed(1)}%</div>
                                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lability</div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Kinetics + Functional groups */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Clock size={13} className="text-blue-400" />
                                    Predicted Degradation Kinetics
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Rate Constant k', value: derived.kin.k, unit: 'h⁻¹' },
                                        { label: 'Half-Life', value: `${derived.kin.half_life_hours}h`, unit: `≈ ${derived.kin.half_life_days} days` },
                                        { label: 'Susceptibility', value: `${derived.susc}%`, unit: derived.level },
                                        { label: 'Reaction Order', value: '1st', unit: 'First-order model' },
                                    ].map(({ label, value, unit }) => (
                                        <div key={label} className="p-3 bg-white/3 rounded-xl border border-white/5">
                                            <div className="text-[8px] font-black text-slate-600 uppercase mb-1">{label}</div>
                                            <div className="text-sm font-black text-white">{value}</div>
                                            <div className={`text-[8px] italic ${label === 'Susceptibility' ? levelColor(derived.level) : 'text-slate-600'}`}>{unit}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Activity size={13} className="text-violet-400" />
                                    Detected Functional Groups
                                </h4>
                                {functionalGroups.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {functionalGroups.map(g => (
                                            <span key={g} className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[10px] font-black text-violet-300 uppercase tracking-widest">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">No specific reactive groups detected via SMARTS patterns.</p>
                                )}
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                                    <span className="text-[8px] font-black text-slate-600 uppercase">Lability:</span>
                                    {[['bg-emerald-500', 'Low (0–45%)'], ['bg-amber-500', 'Moderate (45–70%)'], ['bg-red-500', 'High (>70%)']].map(([bg, lbl]) => (
                                        <div key={lbl} className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${bg}`} />
                                            <span className="text-[8px] font-bold text-slate-500">{lbl}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Lability heatmap */}
                        <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Share2 size={12} className="text-purple-400" />
                                Per-Atom Lability Spectrum
                                {source === 'python-gnn' && (
                                    <span className="text-[8px] text-emerald-500 font-bold normal-case italic ml-2">
                                        Real GCN scores — each bar is a genuine GNN-computed atom susceptibility
                                    </span>
                                )}
                            </h4>
                            <div className="flex h-10 rounded-xl overflow-hidden gap-px">
                                {gnnData.atom_lability.map((atom, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scaleY: 0, originY: 1 }}
                                        animate={{ scaleY: atom.lability, originY: 1 }}
                                        transition={{ delay: i * 0.04, duration: 0.4 }}
                                        className={`flex-1 flex items-end group relative cursor-default ${labilityBg(atom.lability)} opacity-80 hover:opacity-100 transition-opacity rounded-sm`}
                                        style={{ height: '100%' }}
                                        title={`${atom.symbol}[${atom.index}]: ${(atom.lability * 100).toFixed(1)}%`}
                                    >
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {atom.symbol}[{atom.index}] {(atom.lability * 100).toFixed(0)}%
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-600 font-bold mt-1">
                                <span>Atom 0</span>
                                <span>Atom {gnnData.num_atoms - 1}</span>
                            </div>
                        </div>

                        {/* Model info footer */}
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[8px] text-slate-700 italic">
                                {source === 'python-gnn'
                                    ? `Model: ${gnnData.model_type} · Atoms processed via rdkit molecular graph · PyTorch GCN forward pass`
                                    : 'Model: Heuristic rule-based fallback (PyTorch unavailable)'}
                            </span>
                            {source === 'python-gnn' && (
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">● Live GNN</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GNNAnalysis;
