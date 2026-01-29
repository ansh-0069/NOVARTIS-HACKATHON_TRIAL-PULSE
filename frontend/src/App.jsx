import { useState } from 'react';
import Calculator from './components/Calculator';
import History from './components/History';
import { FileText, History as HistoryIcon } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">
                Mass Balance Calculator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Pharmaceutical Forced Degradation Analysis
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'calculator'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <FileText size={20} />
                Calculator
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <HistoryIcon size={20} />
                History
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'calculator' ? <Calculator /> : <History />}
      </main>

      <footer className="bg-white shadow-lg mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          <p>Mass Balance Calculator v1.0 | ICH Q1A(R2) Compliant</p>
          <p className="mt-1">For pharmaceutical forced degradation studies</p>
        </div>
      </footer>
    </div>
  );
}

export default App;