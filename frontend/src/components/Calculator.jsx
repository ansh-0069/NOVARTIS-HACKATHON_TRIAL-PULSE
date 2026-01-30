import { useState } from 'react';
import axios from 'axios';
import Results from './Results';
import { Calculator as CalcIcon, Save, RotateCcw } from 'lucide-react';

// Where our backend lives
const API_URL = 'http://localhost:5000/api';

function Calculator() {
  // Let's set up the default values so the user sees a working example right away.
  const [inputs, setInputs] = useState({
    initial_api: 98,
    stressed_api: 82.5,
    initial_degradants: 0.5,
    stressed_degradants: 4.9,
    degradant_mw: 250,
    parent_mw: 500,
    rrf: 0.8,
    stress_type: 'Base', // Defaulting to Base stress
    sample_id: 'ABC-001',
    analyst_name: 'Lab Analyst'
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Updates the state as the user types.
  // We do a little check to distinguish between text fields and number fields.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name.includes('_type') || name.includes('_id') || name.includes('_name')
        ? value
        : parseFloat(value) || ''
    }));
    setSaved(false); // Reset saved status if they change something
  };

  // Sends the data off to our backend to get the mass balance numbers.
  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/calculate`, inputs);
      setResults(response.data);
    } catch (error) {
      alert('Oops, calculation error: ' + error.message);
    }
    setLoading(false);
  };

  // Saves the current work to the database so we can look it up later.
  const handleSave = async () => {
    if (!results) return; // Can't save what we haven't calculated!
    try {
      await axios.post(`${API_URL}/save`, { inputs, results });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Hide the "Saved!" message after 3 seconds
    } catch (error) {
      alert('Save error: ' + error.message);
    }
  };

  // Clears everything out so we can start fresh.
  const handleReset = () => {
    setInputs({
      initial_api: 98,
      stressed_api: 82.5,
      initial_degradants: 0.5,
      stressed_degradants: 4.9,
      degradant_mw: 250,
      parent_mw: 500,
      rrf: 0.8,
      stress_type: 'Base',
      sample_id: '',
      analyst_name: ''
    });
    setResults(null);
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Input Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CalcIcon size={24} />
          Input Data
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* We've organized these inputs to flow logically for the analyst */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial API (%)
            </label>
            <input
              type="number"
              name="initial_api"
              value={inputs.initial_api}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stressed API (%)
            </label>
            <input
              type="number"
              name="stressed_api"
              value={inputs.stressed_api}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Degradants (%)
            </label>
            <input
              type="number"
              name="initial_degradants"
              value={inputs.initial_degradants}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stressed Degradants (%)
            </label>
            <input
              type="number"
              name="stressed_degradants"
              value={inputs.stressed_degradants}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Degradant MW (optional)
            </label>
            <input
              type="number"
              name="degradant_mw"
              value={inputs.degradant_mw}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent MW (optional)
            </label>
            <input
              type="number"
              name="parent_mw"
              value={inputs.parent_mw}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RRF (optional)
            </label>
            <input
              type="number"
              name="rrf"
              value={inputs.rrf}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.1"
              min="0.1"
              max="2.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stress Type
            </label>
            <select
              name="stress_type"
              value={inputs.stress_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Acid</option>
              <option>Base</option>
              <option>Oxidative</option>
              <option>Photolytic</option>
              <option>Thermal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample ID (optional)
            </label>
            <input
              type="text"
              name="sample_id"
              value={inputs.sample_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analyst Name (optional)
            </label>
            <input
              type="text"
              name="analyst_name"
              value={inputs.analyst_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
          >
            {loading ? 'Calculating...' : 'Calculate Mass Balance'}
          </button>

          {results && (
            <button
              onClick={handleSave}
              className={`px-6 py-3 rounded-lg transition font-semibold flex items-center gap-2 ${saved
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Save size={20} />
              {saved ? 'Saved!' : 'Save'}
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-semibold flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>
      </div>

      {/* Show the results component only if we have data */}
      {results && <Results results={results} />}
    </div>
  );
}

export default Calculator;
