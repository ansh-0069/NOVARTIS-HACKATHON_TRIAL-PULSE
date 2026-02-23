import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Shield, CheckCircle, AlertTriangle, XCircle, Download,
    FileText, BookOpen, ExternalLink, ChevronDown, ChevronRight,
    Sparkles, AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

function Regulatory() {
    const [matrix, setMatrix] = useState(null);
    const [selectedGuideline, setSelectedGuideline] = useState(null);
    const [expandedReqs, setExpandedReqs] = useState({});
    const [loading, setLoading] = useState(true);
    const [dossier, setDossier] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [searchName, setSearchName] = useState('');

    useEffect(() => {
        fetchMatrix();
    }, []);

    const handleGenerateDossier = async () => {
        if (!searchName) return alert('Enter product name (e.g., Aspirin)');
        setGenerating(true);
        try {
            const response = await axios.post(`${API_URL}/regulatory/dossier`, { product_name: searchName });
            if (response.data.success) {
                setDossier(response.data.dossier);
            }
        } catch (error) {
            console.error('Dossier error:', error);
            alert('Failed to generate dossier');
        } finally {
            setGenerating(false);
        }
    };

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/regulatory/matrix`);
            setMatrix(response.data);
        } catch (error) {
            console.error('Error fetching regulatory matrix:', error);
        }
        setLoading(false);
    };

    const handleDownload = async (format) => {
        try {
            const response = await axios.get(
                `${API_URL}/regulatory/download/${format}`,
                { responseType: format === 'json' ? 'json' : 'blob' }
            );

            const url = window.URL.createObjectURL(
                new Blob([format === 'json' ? JSON.stringify(response.data, null, 2) : response.data])
            );
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `regulatory_compliance.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download compliance report');
        }
    };

    const toggleRequirement = (reqId) => {
        setExpandedReqs(prev => ({
            ...prev,
            [reqId]: !prev[reqId]
        }));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLIANT':
                return <CheckCircle className="text-green-400" size={20} />;
            case 'PARTIAL':
                return <AlertTriangle className="text-yellow-400" size={20} />;
            case 'NON-COMPLIANT':
                return <XCircle className="text-red-400" size={20} />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLIANT':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'PARTIAL':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'NON-COMPLIANT':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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

    if (!matrix) {
        return (
            <div className="text-center py-12">
                <Shield size={64} className="text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Compliance Data</h3>
                <p className="text-slate-400">Unable to load regulatory matrix</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Shield className="text-blue-400" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Regulatory Compliance Matrix</h2>
                        </div>
                        <p className="text-slate-400 text-sm">
                            ICH/FDA/EMA Traceability - {matrix.summary.total_guidelines} Guidelines, {matrix.summary.total_requirements} Requirements
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative mr-4">
                            <input
                                type="text"
                                placeholder="Product Name..."
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleGenerateDossier}
                                disabled={generating}
                                className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-all disabled:opacity-50"
                            >
                                {generating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={14} />}
                            </button>
                        </div>
                        <button
                            onClick={() => handleDownload('json')}
                            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm flex items-center gap-2 transition-all"
                        >
                            <Download size={16} />
                            JSON
                        </button>
                    </div>
                </div>
            </div>

            {/* Regulatory Dossier Preview */}
            {dossier && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] bg-blue-500 text-white font-black px-2 py-0.5 rounded uppercase mb-2 inline-block tracking-widest">Regulatory Dossier</span>
                            <h3 className="text-2xl font-bold text-white">{dossier.metadata.product_name}</h3>
                            <p className="text-slate-400 text-xs mt-1">Report ID: {dossier.metadata.report_id} • Generated {new Date(dossier.metadata.generated_at).toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => setDossier(null)}
                            className="text-slate-500 hover:text-white"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Compliance Findings</h4>
                            {dossier.sections.ich_alerts.length > 0 ? (
                                dossier.sections.ich_alerts.map((alert, idx) => (
                                    <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-1">
                                            <AlertCircle size={12} /> {alert.type}
                                        </div>
                                        <div className="text-white text-sm font-medium">{alert.component}</div>
                                        <div className="text-xs text-slate-400">{alert.value}% (Limit: {alert.limit}%)</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-emerald-400 text-sm flex items-center gap-2 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                                    <CheckCircle size={16} /> No ICH Q3B Qualification triggers found.
                                </div>
                            )}
                        </div>

                        <div className="col-span-2 space-y-4 text-sm">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Analysis History</h4>
                            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                                {dossier.sections.mass_balance_summary.map(calc => (
                                    <div key={calc.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                                        <div>
                                            <div className="text-white font-bold">Batch: {calc.batch}</div>
                                            <div className="text-[10px] text-slate-500">{new Date(calc.date).toLocaleDateString()} • {calc.method}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-emerald-400 font-mono font-bold">{calc.value}%</div>
                                            <div className={`text-[10px] px-1.5 rounded uppercase font-black ${calc.risk === 'Low' ? 'text-green-500 bg-green-500/10' : 'text-amber-500 bg-amber-500/10'}`}>{calc.risk} Risk</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Compliance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(matrix.guidelines).map(([key, guideline], index) => (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedGuideline(selectedGuideline === key ? null : key)}
                        className="relative overflow-hidden rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 cursor-pointer hover:border-slate-700/50 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{guideline.guideline}</h3>
                                <p className="text-xs text-slate-400 line-clamp-2">{guideline.title}</p>
                            </div>
                            <div className={`text-2xl font-bold ${parseFloat(guideline.compliance_score) >= 90 ? 'text-green-400' :
                                parseFloat(guideline.compliance_score) >= 70 ? 'text-yellow-400' :
                                    'text-red-400'
                                }`}>
                                {guideline.compliance_score}%
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Total Requirements</span>
                                <span className="text-white font-semibold">{guideline.summary.total_requirements}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-400">Compliant</span>
                                <span className="text-white font-semibold">{guideline.summary.compliant}</span>
                            </div>
                            {guideline.summary.partial > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-yellow-400">Partial</span>
                                    <span className="text-white font-semibold">{guideline.summary.partial}</span>
                                </div>
                            )}
                            {guideline.summary.non_compliant > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-red-400">Non-Compliant</span>
                                    <span className="text-white font-semibold">{guideline.summary.non_compliant}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Click for details</span>
                            {selectedGuideline === key ? (
                                <ChevronDown className="text-blue-400" size={16} />
                            ) : (
                                <ChevronRight className="text-slate-500 group-hover:text-slate-400" size={16} />
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Requirements View */}
            {selectedGuideline && matrix.guidelines[selectedGuideline] && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8"
                >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BookOpen className="text-blue-400" size={24} />
                        {matrix.guidelines[selectedGuideline].guideline} - Detailed Requirements
                    </h3>

                    <div className="space-y-4">
                        {matrix.guidelines[selectedGuideline].requirements.map((req, index) => (
                            <div
                                key={req.id}
                                className="border border-slate-800/50 rounded-xl overflow-hidden bg-slate-800/30 hover:bg-slate-800/50 transition-all"
                            >
                                <div
                                    onClick={() => toggleRequirement(req.id)}
                                    className="p-5 cursor-pointer flex items-start justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(req.status)}
                                            <h4 className="text-sm font-bold text-white">{req.id}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-2">{req.requirement}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>SOP: {req.sop_reference}</span>
                                            <span>•</span>
                                            <span>Method: {req.method}</span>
                                        </div>
                                    </div>

                                    {expandedReqs[req.id] ? (
                                        <ChevronDown className="text-slate-400 flex-shrink-0" size={20} />
                                    ) : (
                                        <ChevronRight className="text-slate-400 flex-shrink-0" size={20} />
                                    )}
                                </div>

                                {expandedReqs[req.id] && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="px-5 pb-5 space-y-4 border-t border-slate-800/50"
                                    >
                                        <div className="pt-4">
                                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Implementation</h5>
                                            <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-lg">
                                                {req.implementation}
                                            </p>
                                        </div>

                                        <div>
                                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Evidence</h5>
                                            <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-lg">
                                                {req.evidence}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Validation File</h5>
                                                <div className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer">
                                                    <FileText size={14} />
                                                    <span className="font-mono">{req.validation_file}</span>
                                                    <ExternalLink size={12} />
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Test Case</h5>
                                                <div className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 cursor-pointer font-mono">
                                                    <FileText size={14} />
                                                    <span>{req.test_case}</span>
                                                    <ExternalLink size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Compliance Legend */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Compliance Status Legend</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <CheckCircle className="text-green-400" size={24} />
                        <div>
                            <div className="font-semibold text-green-400">COMPLIANT</div>
                            <div className="text-xs text-slate-400">Fully meets regulatory requirement</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <AlertTriangle className="text-yellow-400" size={24} />
                        <div>
                            <div className="font-semibold text-yellow-400">PARTIAL</div>
                            <div className="text-xs text-slate-400">Partially implemented, upgrade needed</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <XCircle className="text-red-400" size={24} />
                        <div>
                            <div className="font-semibold text-red-400">NON-COMPLIANT</div>
                            <div className="text-xs text-slate-400">Not implemented, requires development</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default Regulatory;
