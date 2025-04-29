import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedComponent from '../components/AnimatedComponent';
import { Camera, Shield, Sliders, Clock, RefreshCw, ZoomIn, Activity, User, Sun, Target, Ruler } from 'lucide-react';
import CONFIG from '../utils/CONFIG';
import { getSettings, saveSettings, resetSettings, settingsInfo, SETTINGS_STORAGE_KEY } from '../utils/settingsUtils';

const SettingsPage = () => {
  const [settings, setSettings] = useState(CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      setHasChanges(true);
      setSaveSuccess(false);
      return newSettings;
    });
  };

  const handleSave = () => {
    const success = saveSettings(settings);
    if (success) {
      setHasChanges(false);
      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleReset = () => {
    setSettings(resetSettings());
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Helper function to get the icon component
  const getIconComponent = (iconName, color) => {
    const iconProps = { size: 20, className: `text-${color}-500` };
    
    switch (iconName) {
      case 'shield': return <Shield {...iconProps} />;
      case 'user': return <User {...iconProps} />;
      case 'clock': return <Clock {...iconProps} />;
      case 'zoom-in': return <ZoomIn {...iconProps} />;
      case 'activity': return <Activity {...iconProps} />;
      case 'refresh-cw': return <RefreshCw {...iconProps} />;
      case 'sliders': return <Sliders {...iconProps} />;
      case 'sun': return <Sun {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'ruler': return <Ruler {...iconProps} />;
      default: return <Sliders {...iconProps} />;
    }
  };

  const renderSettingControl = (key) => {
    const info = settingsInfo[key];
    const value = settings[key];
    
    if (!info) return null;
    
    return (
      <div key={key} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {getIconComponent(info.icon, info.color)}
          <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">
            {info.title}
          </label>
        </div>
        
        <div className="mb-2">
          {info.type === "range" ? (
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={info.min}
                max={info.max}
                step={info.step}
                value={value}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-blue-500"
              />
              <span className="text-sm font-mono text-gray-600 dark:text-neutral-300 min-w-[40px] text-right">
                {value.toFixed(2)}
              </span>
            </div>
          ) : (
            <input
              type="number"
              min={info.min}
              max={info.max}
              step={info.step}
              value={value}
              onChange={(e) => handleChange(key, parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-neutral-400 italic">
          {info.description}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      <AnimatedComponent>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Face Detection Settings
          </h1>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              <span>Reset to Defaults</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:dark:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 flex items-center gap-2 ${
                hasChanges ? "animate-pulse" : ""
              }`}
            >
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </AnimatedComponent>

      {saveSuccess && (
        <AnimatedComponent>
          <div className="mb-6 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>Settings saved successfully! They will be applied to future detection sessions.</span>
          </div>
        </AnimatedComponent>
      )}

      <div className="bg-white/90 dark:bg-neutral-800/90 rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-neutral-700/50"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.keys(CONFIG).map(key => renderSettingControl(key))}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;