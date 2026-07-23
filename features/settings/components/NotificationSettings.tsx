'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, DollarSign, Save } from 'lucide-react';

interface NotificationConfig {
  lowStockAlerts: boolean;
  highValueSaleAlerts: boolean;
  highValueThreshold: number;
}

const DEFAULT_CONFIG: NotificationConfig = {
  lowStockAlerts: true,
  highValueSaleAlerts: true,
  highValueThreshold: 50000,
};

export function NotificationSettings() {
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('notification_settings');
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch {
        // Use defaults
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('notification_settings', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
      <div className="px-6 py-5 border-b border-[#E5E7EB]">
        <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#C8A348]" />
          Push Notification Settings
        </h3>
        <p className="text-sm text-[#6B7280] mt-1">
          Configure which push notifications you receive on your mobile device
        </p>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Low Stock Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.lowStockAlerts ? (
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <BellOff className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[#111827]">Low Stock Alerts</p>
              <p className="text-xs text-[#6B7280]">
                Get notified when products drop below their stock threshold
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, lowStockAlerts: !c.lowStockAlerts }))}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              config.lowStockAlerts ? 'bg-[#C8A348]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                config.lowStockAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* High Value Sale Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.highValueSaleAlerts ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[#111827]">High-Value Sale Alerts</p>
              <p className="text-xs text-[#6B7280]">
                Get notified when a sale exceeds the threshold below
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, highValueSaleAlerts: !c.highValueSaleAlerts }))}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              config.highValueSaleAlerts ? 'bg-[#C8A348]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                config.highValueSaleAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Threshold Input */}
        {config.highValueSaleAlerts && (
          <div className="pl-13 ml-13">
            <label className="block text-sm font-medium text-[#111827] mb-2">
              High-Value Sale Threshold (\u20A6)
            </label>
            <input
              type="number"
              value={config.highValueThreshold}
              onChange={(e) => setConfig(c => ({ ...c, highValueThreshold: parseInt(e.target.value) || 0 }))}
              className="w-full max-w-xs px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8A348]/30 focus:border-[#C8A348]"
              min={0}
              step={5000}
            />
            <p className="text-xs text-[#6B7280] mt-1.5">
              You&apos;ll be notified for sales above \u20A6{config.highValueThreshold.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#C8A348] text-white rounded-xl text-sm font-semibold hover:bg-[#B8933E] transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">Settings saved \u2713</span>
        )}
      </div>
    </div>
  );
}
