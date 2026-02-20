import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, BarChart3, Database, History as HistoryIcon,
  Shield, Sparkles, Clock, Menu, X
} from 'lucide-react';
import Calculator from './components/Calculator';
import Analytics from './components/Analytics';
import History from './components/History';
import Regulatory from './components/Regulatory';
import LIMSConfig from './components/LIMSConfig';
import LimsPortal from './components/LimsPortal';
import PredictiveDegradation from './components/PredictiveDegradation';
import QbDDashboard from './components/QbDDashboard';
import StabilityMonitor from './components/StabilityMonitor';
import SafeErrorBoundary from './components/SafeErrorBoundary';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [historyEntry, setHistoryEntry] = useState(null);
  const [limsEntry, setLimsEntry] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleViewHistoryEntry = (calc) => {
    setHistoryEntry(calc);
    setActiveTab('calculator');
    setIsMobileMenuOpen(false);
  };

  const handleLimsIngest = (sample) => {
    setLimsEntry(sample);
    setActiveTab('calculator');
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    { id: 'calculator', label: 'Analysis Lab', icon: Activity, group: 'Lab' },
    { id: 'history', label: 'Archive', icon: HistoryIcon, group: 'Lab' },
    { id: 'analytics', label: 'Intelligence', icon: BarChart3, group: 'AI' },
    { id: 'predict', label: 'Predict', icon: Sparkles, group: 'AI' },
    { id: 'stability', label: 'Stability', icon: Clock, group: 'AI' },
    { id: 'regulatory', label: 'Compliance', icon: Shield, group: 'Reg' },
    { id: 'qbd', label: 'QbD', icon: Shield, group: 'Reg' },
    { id: 'lims', label: 'Enterprise', icon: Database, group: 'Reg' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Modern Navbar */}
        <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-2xl bg-slate-950/80">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between h-20">

              {/* Brand Section */}
              <motion.div
                className="flex items-center gap-4 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveTab('calculator')}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 blur-lg opacity-40 animate-pulse" />
                  <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                    <Sparkles className="text-white" size={20} />
                  </div>
                </div>
                <div className="block">
                  <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none">
                    Mass Balance
                  </h1>
                  <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1 block">Platform</span>
                </div>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden xl:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 group ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-bg"
                          className="absolute inset-0 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <Icon size={16} className={`relative z-10 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Menu Toggle */}
              <div className="xl:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* Action Section (Desktop) */}
              <div className="hidden xl:flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Secure</span>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono">256-BIT ENCRYPTION</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="xl:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl overflow-hidden"
              >
                <div className="px-4 py-6 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <Icon size={20} />
                        <span className="font-semibold">{tab.label}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 md:py-10">
          <SafeErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.3, ease: "circOut" }}
              >
                {activeTab === 'calculator' && (
                  <Calculator
                    historyEntry={historyEntry}
                    onHistoryEntryConsumed={() => setHistoryEntry(null)}
                    limsEntry={limsEntry}
                    onLimsEntryConsumed={() => setLimsEntry(null)}
                  />
                )}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'history' && <History onViewEntry={handleViewHistoryEntry} />}
                {activeTab === 'regulatory' && <Regulatory />}
                {activeTab === 'lims' && <LimsPortal onIngest={handleLimsIngest} />}
                {activeTab === 'predict' && <PredictiveDegradation />}
                {activeTab === 'qbd' && <QbDDashboard />}
                {activeTab === 'stability' && <StabilityMonitor />}
              </motion.div>
            </AnimatePresence>
          </SafeErrorBoundary>
        </main>

        {/* Dynamic Footer */}
        <footer className="mt-auto border-t border-white/5 bg-slate-950/20 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-slate-500 hover:text-slate-400 text-xs transition-colors cursor-help border-b border-dashed border-slate-700 pb-0.5">
                ICH Q1A(R2) / Q3B(R2) Validated
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex gap-4">
                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-slate-500 font-bold uppercase tracking-tighter">95% Conf. Interval</div>
                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-slate-500 font-bold uppercase tracking-tighter">G x P Compliant</div>
              </div>

            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;