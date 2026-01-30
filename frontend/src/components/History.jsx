import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Eye } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function History() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Every time the page number changes, we fetch the new batch of history.
  useEffect(() => {
    fetchHistory();
  }, [page]);

  // Go ask the server for the list of past calculations.
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/history`, {
        params: { page, limit: 20 }
      });
      setCalculations(response.data.calculations);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    setLoading(false);
  };

  // When you want to forget a result forever.
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;
    try {
      await axios.delete(`${API_URL}/calculation/${id}`);
      fetchHistory(); // Refresh the list so it's gone from the screen too
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  // Show a loading state so the user knows we're working on it.
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-xl text-gray-600">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculation History</h2>

      {/* Empty state handling - nice and friendly */}
      {calculations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No calculations saved yet.</p>
          <p className="text-sm mt-2">Calculate and save your first mass balance to see it here!</p>
        </div>
      ) : (
        <>
          {/* The main data table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sample ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Analyst</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stress Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Result</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc) => (
                  <tr key={calc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(calc.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{calc.sample_id || '-'}</td>
                    <td className="px-4 py-3 text-sm">{calc.analyst_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{calc.stress_type}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{calc.recommended_method}</td>
                    <td className="px-4 py-3 text-sm font-bold">{calc.recommended_value}%</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${calc.status === 'PASS' ? 'bg-green-100 text-green-700' :
                          calc.status === 'ALERT' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {calc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(calc.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete calculation"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Showing {calculations.length} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                Page {page}
              </div>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default History;
