import { useState, useEffect } from 'react'
import axios from 'axios'
import { Shield, Key, Clock, CheckCircle, XCircle, RefreshCw, Power, Plus, Copy, Check } from 'lucide-react'

const API_BASE = 'http://localhost:3000/api/admin';

// Basic Dashboard Implementation
function App() {
  const [activeTab, setActiveTab] = useState('generate'); // generate, requests, licenses
  const [requests, setRequests] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Key Generation State
  const [genEmail, setGenEmail] = useState('');
  const [genAccessType, setGenAccessType] = useState('permanent');
  const [genDays, setGenDays] = useState(30);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, licRes] = await Promise.all([
        axios.get(`${API_BASE}/requests`),
        axios.get(`${API_BASE}/licenses`)
      ]);
      setRequests(reqRes.data);
      setLicenses(licRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/generate-key`, {
        user_email: genEmail || null,
        access_type: genAccessType,
        duration_days: genAccessType !== 'permanent' ? genDays : null
      });
      setGeneratedKey(res.data.license_key);
      fetchData(); // Refresh licenses list
    } catch (err) {
      alert('Failed to generate key: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (license_key) => {
    if (!confirm('Revoke this license? The user will lose access immediately.')) return;
    try {
      await axios.post(`${API_BASE}/revoke`, { license_key });
      fetchData();
    } catch (err) {
      alert('Failed to revoke');
    }
  };

  const handleApprove = async (id, type, days) => {
    try {
      await axios.post(`${API_BASE}/approve`, {
        request_id: id,
        access_type: type,
        duration_days: days
      });
      fetchData();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if(!confirm('Reject this request?')) return;
    try {
      await axios.post(`${API_BASE}/reject`, { request_id: id });
      fetchData();
    } catch (err) {
      alert('Failed to reject');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NovaStream Admin</h1>
              <p className="text-zinc-400 text-sm">License Management System</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-green-500" />
              <span className="text-lg font-bold">{licenses.filter(l => l.status === 'active').length}</span>
              <span className="text-zinc-500 text-sm uppercase tracking-wider">Active</span>
            </div>
            <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-lg font-bold">{licenses.filter(l => l.status === 'unused').length}</span>
              <span className="text-zinc-500 text-sm uppercase tracking-wider">Unused</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-1">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'generate' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <span className="flex items-center gap-2"><Plus size={16} /> Generate Key</span>
            {activeTab === 'generate' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 translate-y-1" />}
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'requests' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Access Requests
            {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 translate-y-1" />}
          </button>
          <button 
            onClick={() => setActiveTab('licenses')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'licenses' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            All Licenses
            {activeTab === 'licenses' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 translate-y-1" />}
          </button>
        </div>

        {/* Content */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {activeTab === 'generate' ? (
            <GenerateKeyPanel 
              email={genEmail} setEmail={setGenEmail}
              accessType={genAccessType} setAccessType={setGenAccessType}
              days={genDays} setDays={setGenDays}
              generatedKey={generatedKey}
              onGenerate={handleGenerateKey}
              onCopy={copyToClipboard}
              copied={copied}
              loading={loading}
            />
          ) : activeTab === 'requests' ? (
            <RequestsTable requests={requests} onApprove={handleApprove} onReject={handleReject} />
          ) : (
            <LicensesTable licenses={licenses} onRevoke={handleRevoke} />
          )}
        </div>

      </div>
    </div>
  )
}

function GenerateKeyPanel({ email, setEmail, accessType, setAccessType, days, setDays, generatedKey, onGenerate, onCopy, copied, loading }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Key className="text-red-500" /> Generate New License Key
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">User Email (Optional)</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Access Type</label>
            <select 
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="permanent">Permanent (Never Expires)</option>
              <option value="trial">Trial (Limited Days)</option>
            </select>
          </div>
          
          {accessType === 'trial' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Trial Duration (Days)</label>
              <input 
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
          )}
          
          <button 
            onClick={onGenerate}
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
            Generate Key
          </button>
        </div>
        
        {/* Result */}
        <div className="flex items-center justify-center">
          {generatedKey ? (
            <div className="text-center p-8 bg-zinc-800/50 border border-zinc-700 rounded-2xl w-full">
              <div className="text-green-400 mb-4 flex items-center justify-center gap-2">
                <CheckCircle size={24} />
                <span className="font-medium">Key Generated!</span>
              </div>
              <div className="bg-black p-4 rounded-lg font-mono text-2xl text-white tracking-wider mb-4 select-all">
                {generatedKey}
              </div>
              <button 
                onClick={() => onCopy(generatedKey)}
                className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <p className="text-zinc-500 text-sm mt-4">
                Give this key to your user. It can only be activated on one device.
              </p>
            </div>
          ) : (
            <div className="text-center p-8 text-zinc-600">
              <Key size={64} className="mx-auto mb-4 opacity-20" />
              <p>Generated keys will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestsTable({ requests, onApprove, onReject }) {
  const pending = requests.filter(r => r.status === 'pending');
  const history = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      {/* Pending Section */}
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Pending Approval
        </h2>
        {pending.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
            No pending requests
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(req => (
              <div key={req.id} className="bg-black/40 border border-zinc-700 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-lg">{req.machine_name || 'Unknown PC'}</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700 font-mono">{req.device_id.substring(0, 12)}...</span>
                  </div>
                  <div className="text-zinc-400 text-sm flex gap-4">
                    <span>{new Date(req.requested_at).toLocaleString()}</span>
                    <span>IP: {req.ip_address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onReject(req.id)}
                    className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XCircle size={20} />
                  </button>
                  <div className="h-8 w-px bg-zinc-700 mx-1" />
                  <button 
                    onClick={() => onApprove(req.id, 'permanent', null)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200"
                  >
                    <CheckCircle size={16} />
                    Approve Permanent
                  </button>
                  <button 
                    onClick={() => onApprove(req.id, 'trial', 30)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 border border-zinc-700"
                  >
                    30 Days
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="p-6 bg-zinc-900/30">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Request History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-3 pl-2">Machine</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(req => (
                <tr key={req.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-3 pl-2">{req.machine_name}</td>
                  <td className="py-3">{new Date(req.requested_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LicensesTable({ licenses, onRevoke }) {
  const getStatusStyle = (status) => {
    switch(status) {
      case 'active': return 'bg-green-400/10 text-green-400';
      case 'unused': return 'bg-blue-400/10 text-blue-400';
      case 'revoked': return 'bg-red-400/10 text-red-400';
      default: return 'bg-zinc-400/10 text-zinc-400';
    }
  };

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-950/50 text-zinc-200 uppercase text-xs tracking-wider font-semibold">
            <tr>
              <th className="p-3 rounded-l-lg">License Key</th>
              <th className="p-3">Type</th>
              <th className="p-3">Device</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {licenses.map(lic => (
              <tr key={lic.license_key} className="hover:bg-white/5 transition-colors group">
                <td className="p-3 font-mono text-white select-all">{lic.license_key}</td>
                <td className="p-3 capitalize">{lic.access_type}</td>
                <td className="p-3 font-mono text-xs">
                  {lic.device_id ? `${lic.device_id.substring(0, 8)}...` : <span className="text-zinc-600">Not bound</span>}
                </td>
                <td className="p-3">
                   {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(lic.status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${lic.status === 'active' ? 'bg-green-400' : lic.status === 'unused' ? 'bg-blue-400' : 'bg-red-400'}`} />
                    {lic.status}
                  </span>
                </td>
                <td className="p-3">
                  {lic.status !== 'revoked' && (
                    <button 
                      onClick={() => onRevoke(lic.license_key)}
                      className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Revoke License"
                    >
                      <Power size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {licenses.length === 0 && (
         <div className="text-center py-12 text-zinc-600">No licenses found. Generate one above!</div>
      )}
    </div>
  )
}

export default App
