import { useState, useEffect } from 'react';
import axios from '../services/api';

interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
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

  useEffect(() => {
    fetchSettings();
  }, []);

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
