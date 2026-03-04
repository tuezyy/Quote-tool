import { useState, useEffect } from 'react';
import axios from '../services/api';

interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

interface Installer {
  id: string;
  fullname: string | null;
  email: string;
  phone: string | null;
  isAvailable: boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    tax_rate: '',
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Installer state
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [editingPhone, setEditingPhone] = useState<Record<string, string>>({});
  const [addingInstaller, setAddingInstaller] = useState(false);
  const [newInstaller, setNewInstaller] = useState({ fullname: '', email: '', phone: '', password: '' });
  const [installerMsg, setInstallerMsg] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchInstallers();
  }, []);

  const fetchInstallers = async () => {
    try {
      const res = await axios.get('/users');
      setInstallers((res.data as any[]).filter((u: any) => u.role === 'INSTALLER'));
    } catch {
      // silently fail — installers section just won't show
    }
  };

  const toggleAvailability = async (installer: Installer) => {
    try {
      await axios.put(`/users/${installer.id}`, { isAvailable: !installer.isAvailable });
      setInstallers(prev => prev.map(i => i.id === installer.id ? { ...i, isAvailable: !i.isAvailable } : i));
    } catch {
      setInstallerMsg('Failed to update availability');
    }
  };

  const savePhone = async (installer: Installer) => {
    const phone = editingPhone[installer.id] ?? installer.phone ?? '';
    try {
      await axios.put(`/users/${installer.id}`, { phone });
      setInstallers(prev => prev.map(i => i.id === installer.id ? { ...i, phone } : i));
      setEditingPhone(prev => { const n = { ...prev }; delete n[installer.id]; return n; });
      setInstallerMsg('Phone saved');
      setTimeout(() => setInstallerMsg(''), 2000);
    } catch {
      setInstallerMsg('Failed to save phone');
    }
  };

  const createInstaller = async () => {
    try {
      const res = await axios.post('/users', { ...newInstaller, role: 'INSTALLER' });
      setInstallers(prev => [...prev, res.data]);
      setNewInstaller({ fullname: '', email: '', phone: '', password: '' });
      setAddingInstaller(false);
      setInstallerMsg('Installer added');
      setTimeout(() => setInstallerMsg(''), 2000);
    } catch (err: any) {
      setInstallerMsg(err.response?.data?.error || 'Failed to add installer');
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/settings');
      const settingsMap: Record<string, string> = {};
      response.data.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings({
        tax_rate: settingsMap.tax_rate || '0.0875',
        company_name: settingsMap.company_name || '',
        company_email: settingsMap.company_email || '',
        company_phone: settingsMap.company_phone || '',
        company_address: settingsMap.company_address || ''
      });
      setError('');
    } catch (err: any) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) =>
        axios.put(`/settings/${key}`, { value })
      );

      await Promise.all(updates);
      setSuccess('Settings saved successfully!');

      // Refresh settings
      await fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getTaxRatePercentage = () => {
    const rate = parseFloat(settings.tax_rate || '0');
    return (rate * 100).toFixed(2);
  };

  const handleTaxRatePercentageChange = (percentage: string) => {
    const decimal = parseFloat(percentage) / 100;
    handleChange('tax_rate', decimal.toString());
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage application settings and preferences</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Tax Settings */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Tax Settings</h2>

          <div className="max-w-md">
            <label className="label">Default Tax Rate (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={getTaxRatePercentage()}
                onChange={(e) => handleTaxRatePercentageChange(e.target.value)}
                className="input flex-1"
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This tax rate will be applied to all new quotes. Current value: {getTaxRatePercentage()}%
            </p>
          </div>
        </div>

        {/* Company Information */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Company Information</h2>
          <p className="text-sm text-gray-600 mb-6">
            This information will appear on quotes and PDFs
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="input"
                placeholder="Your Company Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Company Email</label>
                <input
                  type="email"
                  value={settings.company_email}
                  onChange={(e) => handleChange('company_email', e.target.value)}
                  className="input"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label className="label">Company Phone</label>
                <input
                  type="tel"
                  value={settings.company_phone}
                  onChange={(e) => handleChange('company_phone', e.target.value)}
                  className="input"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="label">Company Address</label>
              <textarea
                value={settings.company_address}
                onChange={(e) => handleChange('company_address', e.target.value)}
                className="input"
                rows={3}
                placeholder="123 Main Street, City, State ZIP"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Installer Management */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Installers</h2>
            <p className="text-sm text-gray-500 mt-1">Manage who receives job notifications via SMS</p>
          </div>
          <button onClick={() => setAddingInstaller(true)} className="btn-primary text-sm px-4 py-2">
            + Add Installer
          </button>
        </div>

        {installerMsg && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
            {installerMsg}
          </div>
        )}

        {installers.length === 0 && !addingInstaller && (
          <p className="text-gray-500 text-sm">No installers yet. Add one to enable automatic SMS routing.</p>
        )}

        <div className="space-y-3">
          {installers.map(installer => (
            <div key={installer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
              {/* Availability toggle */}
              <button
                onClick={() => toggleAvailability(installer)}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${installer.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                title={installer.isAvailable ? 'Available — click to mark unavailable' : 'Unavailable — click to mark available'}
              >
                <span className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${installer.isAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{installer.fullname || installer.email}</p>
                <p className="text-xs text-gray-500 truncate">{installer.email}</p>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="+13215551234"
                  value={editingPhone[installer.id] ?? installer.phone ?? ''}
                  onChange={e => setEditingPhone(prev => ({ ...prev, [installer.id]: e.target.value }))}
                  className="input text-sm w-36 py-1"
                />
                {installer.id in editingPhone && (
                  <button onClick={() => savePhone(installer)} className="btn-primary text-xs px-3 py-1">Save</button>
                )}
              </div>

              {/* Status badge */}
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${installer.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {installer.isAvailable ? 'Available' : 'Off'}
              </span>
            </div>
          ))}
        </div>

        {/* Add installer form */}
        {addingInstaller && (
          <div className="mt-4 p-4 border border-blue-200 rounded bg-blue-50 space-y-3">
            <h3 className="font-semibold text-sm">New Installer</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Full name" value={newInstaller.fullname}
                onChange={e => setNewInstaller(p => ({ ...p, fullname: e.target.value }))} className="input text-sm" />
              <input type="tel" placeholder="Phone (+13215551234)" value={newInstaller.phone}
                onChange={e => setNewInstaller(p => ({ ...p, phone: e.target.value }))} className="input text-sm" />
              <input type="email" placeholder="Email" value={newInstaller.email}
                onChange={e => setNewInstaller(p => ({ ...p, email: e.target.value }))} className="input text-sm" />
              <input type="password" placeholder="Password (min 6 chars)" value={newInstaller.password}
                onChange={e => setNewInstaller(p => ({ ...p, password: e.target.value }))} className="input text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={createInstaller} className="btn-primary text-sm px-4 py-2">Add</button>
              <button onClick={() => setAddingInstaller(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="card mt-6">
        <h2 className="text-xl font-bold mb-4">Preview</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is how your company information will appear on quotes:
        </p>

        <div className="p-6 bg-gray-50 border border-gray-200 rounded">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {settings.company_name || 'Your Company Name'}
            </h3>
            {settings.company_address && (
              <p className="text-sm text-gray-600 mb-1">{settings.company_address}</p>
            )}
            <p className="text-sm text-gray-600">
              {settings.company_email || 'email@company.com'} • {settings.company_phone || '(555) 123-4567'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
