import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { playClick, playCorrect } from '../services/sounds';

const SETTINGS_KEY = 'empytv_settings';
const PIN_KEY = 'empytv_pin';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}

function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
function getPin() { return localStorage.getItem(PIN_KEY); }
function setPin(p) { localStorage.setItem(PIN_KEY, p); }

export default function Settings() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [error, setError] = useState('');

  const existingPin = getPin();

  const handlePinSubmit = () => {
    if (isSettingPin) {
      if (pinInput.length === 4) {
        setPin(pinInput);
        setAuthenticated(true);
        playCorrect();
        setError('');
      } else {
        setError('PIN must be 4 digits');
      }
    } else {
      if (pinInput === existingPin) {
        setAuthenticated(true);
        playCorrect();
        setError('');
      } else {
        setError('Wrong PIN');
        setPinInput('');
      }
    }
  };

  const updateSetting = (key, value) => {
    playClick();
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      return updated;
    });
  };

  const clearScores = () => {
    playClick();
    localStorage.removeItem('empytv_scores');
  };

  const resetPin = () => {
    localStorage.removeItem(PIN_KEY);
    setAuthenticated(false);
    setPinInput('');
    setIsSettingPin(true);
  };

  // If no pin exists, go to set pin mode
  useEffect(() => {
    if (!existingPin) setIsSettingPin(true);
  }, [existingPin]);

  if (!authenticated) {
    return (
      <PageLayout title="Parental Controls" icon="🔒">
        <div className="h-full flex flex-col items-center justify-center gap-6 p-4">
          <span className="text-6xl">🔒</span>
          <h2 className="text-xl font-display text-white">
            {isSettingPin ? 'Set a 4-digit PIN' : 'Enter PIN'}
          </h2>
          <p className="text-sm text-white/50 text-center max-w-xs">
            {isSettingPin ? 'Choose a PIN that only grown-ups know' : 'Parents only! Enter your PIN to access settings'}
          </p>

          <div className="flex gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-display ${
                pinInput[i] ? 'border-empy-yellow bg-empy-yellow/20 text-empy-yellow' : 'border-white/30 bg-white/5 text-white/30'
              }`}>
                {pinInput[i] ? '●' : ''}
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm font-display">{error}</p>}

          <div className="grid grid-cols-3 gap-2 max-w-[200px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((n, i) => {
              if (n === null) return <div key={i} />;
              return (
                <motion.button key={i} whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    playClick();
                    if (n === 'del') setPinInput(p => p.slice(0, -1));
                    else if (pinInput.length < 4) setPinInput(p => p + n);
                  }}
                  className="w-14 h-14 rounded-xl bg-white/10 text-white font-display text-xl flex items-center justify-center hover:bg-white/20 active:bg-white/30">
                  {n === 'del' ? '⌫' : n}
                </motion.button>
              );
            })}
          </div>

          <motion.button whileTap={{ scale: 0.9 }} onClick={handlePinSubmit}
            disabled={pinInput.length !== 4}
            className="btn bg-empy-pink text-white border-empy-pink font-display disabled:opacity-30">
            {isSettingPin ? '✓ Set PIN' : '🔓 Unlock'}
          </motion.button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Parental Controls" icon="⚙️">
      <div className="max-w-md mx-auto space-y-6">
        {/* Time Limit */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="font-display text-white text-lg mb-3">⏰ Daily Time Limit</h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 30, label: '30 min' },
              { value: 60, label: '1 hour' },
              { value: 120, label: '2 hours' },
              { value: 0, label: 'Unlimited' },
            ].map(opt => (
              <button key={opt.value} onClick={() => updateSetting('timeLimit', opt.value)}
                className={`btn btn-sm font-display ${settings.timeLimit === opt.value ? 'bg-empy-pink text-white border-empy-pink' : 'btn-ghost text-white/60'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category toggles */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="font-display text-white text-lg mb-3">📂 Enabled Categories</h3>
          {[
            { key: 'videos', label: '📺 Videos', icon: '📺' },
            { key: 'games', label: '🎮 Games', icon: '🎮' },
            { key: 'books', label: '📚 Books', icon: '📚' },
            { key: 'learning', label: '🎓 Learning', icon: '🎓' },
          ].map(cat => (
            <label key={cat.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 cursor-pointer">
              <span className="text-white font-display">{cat.label}</span>
              <input type="checkbox" className="toggle toggle-sm toggle-primary"
                checked={settings[cat.key] !== false}
                onChange={(e) => updateSetting(cat.key, e.target.checked)} />
            </label>
          ))}
        </div>

        {/* Age range */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="font-display text-white text-lg mb-3">👶 Age Range</h3>
          <div className="flex gap-2 flex-wrap">
            {['3-4', '4-5', '5-6', '6-7'].map(range => (
              <button key={range} onClick={() => updateSetting('ageRange', range)}
                className={`btn btn-sm font-display ${settings.ageRange === range ? 'bg-empy-blue text-white border-empy-blue' : 'btn-ghost text-white/60'}`}>
                {range} years
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <h3 className="font-display text-white text-lg">🛠️ Actions</h3>
          <button onClick={clearScores} className="btn btn-sm btn-ghost text-white/60 font-display w-full justify-start">
            🗑️ Clear game scores & progress
          </button>
          <button onClick={resetPin} className="btn btn-sm btn-ghost text-white/60 font-display w-full justify-start">
            🔑 Change PIN
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
