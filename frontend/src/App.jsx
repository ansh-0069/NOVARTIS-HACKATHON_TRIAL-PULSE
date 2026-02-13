import { useState } from 'react';
import { motion } from 'framer-motion';
import Calculator from './components/Calculator';
import History from './components/History';
import Analytics from './components/Analytics';
import { Activity, History as HistoryIcon, BarChart3, Sparkles } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  const tabs = [
    { id: 'calculator', label: 'Analysis Lab', icon: Activity },
    { id: 'analytics', label: 'Intelligence', icon: BarChart3 },
    { id: 'history', label: 'Archive', icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">

      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.05),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.03),transparent_50%)]" />


      {/* Background animation removed to prevent shaky dashboard effect */}


      <div className="relative z-10">

        <nav className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">

              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-500 blur-xl opacity-50" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Mass Balance<span className="text-blue-400"> AI</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Pharmaceutical Intelligence Platform
                  </p>
                </div>
              </motion.div>


              <div className="flex gap-2 bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-slate-800/50">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === tab.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg" />
                      )}
                      <Icon size={18} className="relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>


        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'calculator' && <Calculator />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'history' && <History />}
        </main>


        <footer className="border-t border-slate-800/50 backdrop-blur-xl bg-slate-900/40 mt-12">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-400">
                <span className="text-white font-semibold">Mass Balance AI</span> v2.0
                <span className="mx-2">•</span>
                <span className="text-blue-400">ICH Q1A(R2)</span> Compliant
                <span className="mx-2">•</span>
                Statistical Validation with 95% CI
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>System Operational</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;