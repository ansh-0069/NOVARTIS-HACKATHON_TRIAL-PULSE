
import React from 'react';
import { motion } from 'framer-motion';
import { GitCommit, TrendingUp, RefreshCw, Archive } from 'lucide-react';

const BayesianAnalysis = ({ results }) => {
    // Check if we have any Bayesian results
    const bayesianKeys = Object.keys(results).filter(key => key.endsWith('_bayesian'));

    if (bayesianKeys.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border border-indigo-500/30 bg-indigo-950/20 mb-6"
        >
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <GitCommit size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            Bayesian Refinement
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                                <RefreshCw size={12} /> Adaptive
                            </span>
                        </h3>
                        <p className="text-sm text-indigo-300">
                            Integrates historical data to refine mass balance estimates.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bayesianKeys.map(key => {
                    const method = key.replace('_bayesian', '').toUpperCase().replace('_', '-');
                    const data = results[key];

                    if (!data) return null;

                    const posteriorMean = data.posterior_mean;
                    const [ciLower, ciUpper] = data.credible_interval_95;
                    const priorWeight = data.prior_weight * 100;
                    const dataWeight = data.data_weight * 100;

                    return (
                        <div key={key} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-200">{method} Posterior</span>
                                <span className="text-xs text-indigo-400">95% Credible Interval</span>
                            </div>

                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-bold text-white">{posteriorMean.toFixed(2)}%</span>
                                <span className="text-sm text-slate-500 mb-1">
                                    [{ciLower.toFixed(2)}% - {ciUpper.toFixed(2)}%]
                                </span>
                            </div>

                            {/* Weight Distribution Bar */}
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>Prior Influence ({priorWeight.toFixed(0)}%)</span>
                                    <span>Data Influence ({dataWeight.toFixed(0)}%)</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-slate-600"
                                        style={{ width: `${priorWeight}%` }}
                                    />
                                    <div
                                        className="h-full bg-indigo-500"
                                        style={{ width: `${dataWeight}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                <Archive size={12} />
                <span>Historical priors updated automatically based on method performance.</span>
            </div>
        </motion.div>
    );
};

export default BayesianAnalysis;
