import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Database, CheckCircle, Settings, RefreshCw,
    Info, Eye, EyeOff, Link2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

function LIMSConfig() {
    const [systems, setSystems] = useState([]);
    const [selectedSystem, setSelectedSystem] = useState(null);
    const [config, setConfig] = useState({
        base_url: '',
        api_key: '',
        username: '',
        password: '',
        client_id: '',
        client_secret: '',
        oauth_url: ''
    });
    const [status, setStatus] = useState(null);
    const [testing, setTesting] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchSystems();
        fetchStatus();
    }, []);

    const fetchSystems = async () => {
        try {
            const response = await axios.get(`${API_URL}/lims/systems`);
            setSystems(response.data.systems);
        } catch (error) {
            console.error('Error fetching systems:', error);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/lims/status`);
            setStatus(response.data.status);
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const handleTestConnection = async () => {
        if (!selectedSystem) {
            alert('Please select a LIMS system first');
            return;
        }

        setTesting(true);
        try {
            const response = await axios.post(`${API_URL}/lims/test-connection`, {
                system_name: selectedSystem.id,
                config: config
            });

            if (response.data.success) {
                alert('✓ Connection test successful!');
            } else {
                alert(`✗ Test failed: ${response.data.error}`);
            }
        } catch (error) {
            alert(`✗ Error: ${error.message}`);
        }
        setTesting(false);
    };

    const handleInitialize = async () => {
        if (!selectedSystem) {
            alert('Please select a LIMS system');
            return;
        }

        setInitializing(true);
        try {
            const response = await axios.post(`${API_URL}/lims/initialize`, {
                system_name: selectedSystem.id,
                config: config
            });

            if (response.data.success) {
                alert('✓ LIMS initialized!');
                await fetchStatus();
            } else {
                alert(`✗ Failed: ${response.data.error}`);
            }
        } catch (error) {
            alert(`✗ Error: ${error.message}`);
        }
        setInitializing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Database className="text-blue-400" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">LIMS Integration</h2>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Connect to enterprise Laboratory Information Management Systems
                        </p>
                    </div>

                    {status && status.active_system && (
                        <div className="text-right">
                            <div className="text-sm text-slate-400 mb-1">Active System</div>
                            <div className="text-lg font-bold text-green-400">{status.active_system}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Selection */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="text-blue-400" size={20} />
                    Select LIMS System
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {systems.map((system) => (
                        <motion.div
                            key={system.id}
                            whileHover={{ scale: system.supported ? 1.02 : 1 }}
                            whileTap={{ scale: system.supported ? 0.98 : 1 }}
                            onClick={() => system.supported && setSelectedSystem(system)}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedSystem?.id === system.id
                                ? 'bg-blue-500/10 border-blue-500/50'
                                : system.supported
                                    ? 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 cursor-pointer'
                                    : 'bg-slate-800/20 border-slate-700/30 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-bold ${selectedSystem?.id === system.id ? 'text-blue-400' : 'text-white'
                                        }`}>
                                        {system.name}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-1">{system.type}</p>
                                </div>
                                {selectedSystem?.id === system.id && (
                                    <CheckCircle className="text-blue-400" size={20} />
                                )}
                            </div>

                            <div className={`text-xs px-2 py-1 rounded ${system.supported
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {system.supported ? 'Supported' : 'Not Supported'}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Configuration Form */}
            {selectedSystem && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-8"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Link2 className="text-blue-400" size={20} />
                        Connection Configuration
                    </h3>

                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-slate-300">
                                <p className="font-semibold text-blue-400 mb-1">Selected: {selectedSystem.name}</p>
                                <p className="text-xs">Authentication: {selectedSystem.type}</p>
                            </div>
                        </div>
                    </div>

                    {/* Base URL */}
                    <div className="mb-4">
                        <label className="block mb-2">
                            <span className="text-sm font-medium text-slate-300">Base URL</span>
                            <input
                                type="text"
                                value={config.base_url}
                                onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                                placeholder="https://lims.company.com"
                                className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </label>
                    </div>

                    {/* Dynamic Auth Fields */}
                    {selectedSystem.auth_method === 'API_KEY' && (
                        <div className="mb-4">
                            <label className="block mb-2">
                                <span className="text-sm font-medium text-slate-300">API Key</span>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={config.api_key}
                                        onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                                        placeholder="Enter API key"
                                        className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white mt-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </label>
                        </div>
                    )}

                    {selectedSystem.auth_method === 'USERNAME_PASSWORD' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Username</span>
                                <input
                                    type="text"
                                    value={config.username}
                                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                    placeholder="Username"
                                    className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Password</span>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={config.password}
                                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                        placeholder="Password"
                                        className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white mt-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </label>
                        </div>
                    )}

                    {selectedSystem.auth_method === 'OAUTH2' && (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Token URL</span>
                                <input
                                    type="text"
                                    value={config.oauth_url}
                                    onChange={(e) => setConfig({ ...config, oauth_url: e.target.value })}
                                    placeholder="https://auth.company.com/token"
                                    className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Client ID</span>
                                <input
                                    type="text"
                                    value={config.client_id}
                                    onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                                    placeholder="Client ID"
                                    className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Client Secret</span>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={config.client_secret}
                                        onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                                        placeholder="Client Secret"
                                        className="w-full mt-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white mt-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleTestConnection}
                            disabled={testing}
                            className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                        >
                            {testing ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Test Connection
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleInitialize}
                            disabled={initializing}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {initializing ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Initializing...
                                </>
                            ) : (
                                <>
                                    <Database size={18} />
                                    Initialize
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Status Panel */}
            {status && status.initialized_systems.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-900/20 to-slate-900/50 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={20} />
                        Initialized Systems
                    </h3>

                    <div className="space-y-2">
                        {status.initialized_systems.map((sys, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-white font-semibold">{sys}</span>
                                </div>
                                <span className="text-xs text-slate-400">Active</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default LIMSConfig;
