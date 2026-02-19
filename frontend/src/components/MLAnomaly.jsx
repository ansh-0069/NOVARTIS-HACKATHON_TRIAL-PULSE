
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Brain, Activity } from 'lucide-react';

const MLAnomaly = ({ prediction }) => {
    if (!prediction) return null;

    const { is_anomaly, anomaly_score, failure_probability, risk_level, top_factors } = prediction;

    // Normalize score for display (assuming score range around -0.5 to 0.5 where negative is anomaly)
    // We want a progress bar where 0% is safe and 100% is critical
    // If is_anomaly is true, risk is high.
    // Let's use failure_probability directly if available, else derive from score.

    const displayScore = failure_probability ? Math.round(failure_probability) :
        (is_anomaly ? 85 : 15); // Fallback if probability missing

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl border ${is_anomaly
                ? 'bg-red-950/20 border-red-500/30'
                : 'bg-emerald-950/20 border-emerald-500/30'
                }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${is_anomaly ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {is_anomaly ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            ML Anomaly Detection
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                <Brain size={12} /> AI Powered
                            </span>
                        </h3>
                        <p className={`text-sm ${is_anomaly ? 'text-red-300' : 'text-emerald-300'}`}>
                            {is_anomaly
                                ? 'Potential anomaly detected in mass balance distribution.'
                                : 'Mass balance distribution appears normal.'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{displayScore}%</div>
                    <div className="text-xs text-slate-400">Anomaly Probability</div>
                </div>
            </div>

            {/* Probability Bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${is_anomaly ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                />
            </div>

            {/* Top Factors */}
            {top_factors && top_factors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Contributing Factors
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {top_factors.map((factor, index) => (
                            <div key={index} className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
                                <Activity size={14} className="text-blue-400" />
                                <span className="text-sm text-slate-300 capitalize">
                                    {factor.replace(/_/g, ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 text-xs text-slate-500 flex justify-between">
                <span>Model: Isolation Forest + Random Forest</span>
                <span>v1.0.0</span>
            </div>
        </motion.div>
    );
};

export default MLAnomaly;
