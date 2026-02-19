import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

class SafeErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Render Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-200">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-slate-900/50 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-10 shadow-2xl text-center"
                    >
                        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                            <AlertTriangle className="text-red-500" size={40} />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-4 tracking-tight">System Interruption</h1>
                        <p className="text-slate-400 mb-8 leading-relaxed font-medium">
                            The neural optimization engine encountered an unexpected state. This has been logged for internal review.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20"
                            >
                                <RefreshCw size={18} />
                                Restart Engine
                            </button>

                            <button
                                onClick={() => this.setState({ hasError: false })}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5"
                            >
                                <Home size={18} />
                                Return to Dashboard
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 pt-8 border-t border-white/5 text-left overflow-auto max-h-40">
                                <p className="text-[10px] font-mono text-red-400 whitespace-pre-wrap">
                                    {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default SafeErrorBoundary;
