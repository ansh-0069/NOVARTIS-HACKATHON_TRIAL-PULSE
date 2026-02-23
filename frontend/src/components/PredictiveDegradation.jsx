import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Sparkles, Beaker, TrendingUp, Atom, AlertCircle,
    CheckCircle, ArrowRight, Info, Zap, FlaskConical, Share2
} from 'lucide-react';
import GNNAnalysis from './GNNAnalysis';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

function PredictiveDegradation() {
    const [smiles, setSmiles] = useState('');
    const [stressType, setStressType] = useState('oxidative');
    const [degradationPercent, setDegradationPercent] = useState(10);

    const [prediction, setPrediction] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [mbPrediction, setMbPrediction] = useState(null);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('gnn'); // gnn | products | analysis | mb

    const [examples, setExamples] = useState([]);

    useEffect(() => {
        fetchExamples();
    }, []);

    const fetchExamples = async () => {
        try {
            const response = await axios.get(`${API_URL}/predict/example-molecules`);
            setExamples(response.data.examples);
        } catch (error) {
            console.error('Error fetching examples:', error);
        }
    };

    const handlePredict = async () => {
        if (!smiles) {
            alert('Please enter a SMILES string');
            return;
        }

        setLoading(true);

        try {
            // Predict products
            const productsRes = await axios.post(`${API_URL}/predict/products`, {
                smiles,
                stress_type: stressType
            });

            if (productsRes.data.success) {
                setPrediction(productsRes.data.result);
            }

            // Analyze structure
            const analysisRes = await axios.post(`${API_URL}/predict/analyze`, {
                smiles,
                stress_type: stressType
            });

            if (analysisRes.data.success) {
                setAnalysis(analysisRes.data.result);
            }

            // Predict mass balance
            const mbRes = await axios.post(`${API_URL}/predict/mass-balance`, {
                smiles,
                stress_type: stressType,
                degradation_percent: degradationPercent
            });

            if (mbRes.data.success) {
                setMbPrediction(mbRes.data.result);
            }

        } catch (error) {
            console.error('Prediction error:', error);
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }

        setLoading(false);
    };

    const loadExample = (exampleSmiles) => {
        setSmiles(exampleSmiles);
        setPrediction(null);
        setAnalysis(null);
        setMbPrediction(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-violet-900/20 to-slate-900/50 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                                <Sparkles className="text-violet-400" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Predictive Degradation</h2>
                        </div>
                        <p className="text-slate-400 text-sm">
                            AI-powered prediction of degradation products and mass balance
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Atom className="text-violet-400" size={20} />
                    Molecular Input
                </h3>

                {/* SMILES Input */}
                <div className="mb-6">
                    <label className="block mb-2">
                        <span className="text-sm font-medium text-slate-300">SMILES String</span>
                        <input
                            type="text"
                            value={smiles}
                            onChange={(e) => setSmiles(e.target.value)}
                            placeholder="Enter molecular SMILES (e.g., CC(=O)Oc1ccccc1C(=O)O)"
                            className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </label>

                    <div className="mt-2 text-xs text-slate-400">
                        Don't know SMILES? Try an example below
                    </div>
                </div>

                {/* Example Molecules */}
                <div className="mb-6">
                    <div className="text-sm font-medium text-slate-300 mb-3">Example Molecules:</div>
                    <div className="flex flex-wrap gap-2">
                        {examples.map((ex, idx) => (
                            <button
                                key={idx}
                                onClick={() => loadExample(ex.smiles)}
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-sm text-white transition-all"
                            >
                                {ex.name}
                                <span className="text-xs text-slate-500 ml-2">({ex.category})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block mb-2">
                            <span className="text-sm font-medium text-slate-300">Stress Type</span>
                            <select
                                value={stressType}
                                onChange={(e) => setStressType(e.target.value)}
                                className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            >
                                <option value="acid">Acid</option>
                                <option value="base">Base</option>
                                <option value="oxidative">Oxidative</option>
                                <option value="thermal">Thermal</option>
                                <option value="photolytic">Photolytic</option>
                            </select>
                        </label>
                    </div>

                    <div>
                        <label className="block mb-2">
                            <span className="text-sm font-medium text-slate-300">Expected Degradation (%)</span>
                            <input
                                type="number"
                                value={degradationPercent}
                                onChange={(e) => setDegradationPercent(parseFloat(e.target.value))}
                                min="0"
                                max="100"
                                step="1"
                                className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </label>
                    </div>
                </div>

                {/* Predict Button */}
                <button
                    onClick={handlePredict}
                    disabled={loading || !smiles}
                    className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Predicting...
                        </>
                    ) : (
                        <>
                            <Zap size={20} />
                            Predict Degradation
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {(prediction || analysis || mbPrediction) && (
                <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-4 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('gnn')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'gnn'
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                }`}
                        >
                            <Share2 size={18} className="inline mr-2" />
                            GNN Insights
                        </button>

                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'products'
                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                }`}
                        >
                            <FlaskConical size={18} className="inline mr-2" />
                            Products
                        </button>

                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'analysis'
                                ? 'bg-violet-500 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                }`}
                        >
                            <Beaker size={18} className="inline mr-2" />
                            Analysis
                        </button>

                        <button
                            onClick={() => setActiveTab('mb')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'mb'
                                ? 'bg-violet-500 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                }`}
                        >
                            <TrendingUp size={18} className="inline mr-2" />
                            Mass Balance
                        </button>
                    </div>

                    {/* GNN Tab */}
                    {activeTab === 'gnn' && (
                        <GNNAnalysis smiles={smiles} stressType={stressType} />
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && prediction && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">
                                Predicted Degradation Products ({prediction.num_products})
                            </h3>

                            {prediction.products.length > 0 ? (
                                <div className="space-y-4">
                                    {prediction.products.map((product, idx) => (
                                        <div
                                            key={idx}
                                            className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-white">{product.pathway}</h4>
                                                        <p className="text-xs text-slate-400 capitalize">{product.category}</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-sm text-slate-400 mb-1">Confidence</div>
                                                    <div className="text-2xl font-bold text-violet-400">{product.confidence}%</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-500">MW:</span>
                                                    <span className="text-white font-semibold ml-2">{product.molecular_weight} g/mol</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Omega (ω):</span>
                                                    <span className="text-white font-semibold ml-2">{product.omega}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">SMILES:</span>
                                                    <span className="text-white font-mono text-xs ml-2">{product.smiles}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <AlertCircle className="mx-auto mb-4" size={48} />
                                    <p>No degradation products predicted for {stressType} stress</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analysis Tab */}
                    {activeTab === 'analysis' && analysis && (
                        <div className="space-y-6">
                            {/* Susceptibility */}
                            <div className="p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
                                <h4 className="text-lg font-bold text-white mb-4">Degradation Susceptibility</h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-sm text-slate-400 mb-2">Score</div>
                                        <div className="text-4xl font-bold text-orange-400">
                                            {analysis.degradation_susceptibility.susceptibility_score}/100
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm text-slate-400 mb-2">Level</div>
                                        <div className={`text-2xl font-bold ${analysis.degradation_susceptibility.level === 'HIGH' ? 'text-red-400' :
                                            analysis.degradation_susceptibility.level === 'MODERATE' ? 'text-yellow-400' :
                                                'text-green-400'
                                            }`}>
                                            {analysis.degradation_susceptibility.level}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm text-slate-400 mb-2">Stress Type</div>
                                        <div className="text-xl font-bold text-white capitalize">{stressType}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-slate-300">Reasons:</div>
                                    {analysis.degradation_susceptibility.reasons.map((reason, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                            <ArrowRight className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                                            <span>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Kinetics */}
                            <div className="p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <h4 className="text-lg font-bold text-white mb-4">Degradation Kinetics</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-sm text-slate-400 mb-2">Rate Constant (k)</div>
                                        <div className="text-2xl font-bold text-blue-400">
                                            {analysis.kinetics.rate_constant_k.toFixed(4)} h⁻¹
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-slate-400 mb-2">Half-Life</div>
                                        <div className="text-2xl font-bold text-blue-400">
                                            {analysis.kinetics.half_life_hours.toFixed(1)} hours
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            ({analysis.kinetics.half_life_days.toFixed(1)} days)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Molecular Properties */}
                            <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                <h4 className="text-lg font-bold text-white mb-4">Key Molecular Properties</h4>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-400">Molecular Weight</div>
                                        <div className="text-white font-semibold">
                                            {analysis.molecular_descriptors.molecular_weight.toFixed(2)} g/mol
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-slate-400">LogP</div>
                                        <div className="text-white font-semibold">
                                            {analysis.molecular_descriptors.logp.toFixed(2)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-slate-400">H-Bond Donors</div>
                                        <div className="text-white font-semibold">
                                            {analysis.molecular_descriptors.num_h_donors}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-slate-400">H-Bond Acceptors</div>
                                        <div className="text-white font-semibold">
                                            {analysis.molecular_descriptors.num_h_acceptors}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-slate-400">Rotatable Bonds</div>
                                        <div className="text-white font-semibold">
                                            {analysis.molecular_descriptors.num_rotatable_bonds}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-slate-400">Aromatic Rings</div>
                                        <div className="text-white font-semibold">
                                            {analysis.molecular_descriptors.num_aromatic_rings}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mass Balance Tab */}
                    {activeTab === 'mb' && mbPrediction && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">
                                Predicted Mass Balance
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                                    <div className="text-sm text-slate-400 mb-2">Predicted LK-IMB</div>
                                    <div className="text-5xl font-bold text-green-400">
                                        {mbPrediction.predicted_lk_imb}%
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
                                    <div className="text-sm text-slate-400 mb-2">Predicted CIMB</div>
                                    <div className="text-5xl font-bold text-blue-400">
                                        {mbPrediction.predicted_cimb}%
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                <h4 className="text-md font-semibold text-white mb-4">Prediction Details</h4>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Degradation Level:</span>
                                        <span className="text-white font-semibold">{mbPrediction.degradation_percent}%</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Products Predicted:</span>
                                        <span className="text-white font-semibold">{mbPrediction.num_products_predicted}</span>
                                    </div>
                                </div>

                                {mbPrediction.major_products && mbPrediction.major_products.length > 0 && (
                                    <div className="mt-6">
                                        <div className="text-sm font-semibold text-slate-300 mb-3">Major Products:</div>
                                        {mbPrediction.major_products.map((prod, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                                                <span className="text-slate-300 text-sm">{prod.pathway}</span>
                                                <div className="flex gap-4 text-xs">
                                                    <span className="text-slate-500">ω: <span className="text-white font-semibold">{prod.omega}</span></span>
                                                    <span className="text-slate-500">Conf: <span className="text-violet-400 font-semibold">{prod.confidence}%</span></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info Panel */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-slate-900/50 p-6">
                <div className="flex items-start gap-3">
                    <Info className="text-blue-400 flex-shrink-0" size={20} />
                    <div className="text-sm text-slate-300">
                        <p className="font-semibold text-blue-400 mb-2">How Predictive Degradation Works</p>
                        <p className="text-xs leading-relaxed">
                            This ML-powered system uses RDKit for molecular analysis, reaction SMARTS for transformation prediction,
                            and machine learning to estimate degradation susceptibility. Predictions are based on structural features,
                            known reactivity patterns, and computational chemistry principles. Use these predictions as a starting point
                            for experimental design — actual degradation may vary based on formulation, impurities, and specific conditions.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default PredictiveDegradation;
