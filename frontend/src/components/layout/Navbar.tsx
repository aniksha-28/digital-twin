import React, { useState } from 'react';
import { Bell, Shield, Radio, CheckCircle2, AlertTriangle, AlertOctagon, User as UserIcon, LogOut } from 'lucide-react';
import { User, ScenarioType, Alert } from '../../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  isConnected: boolean;
  activeScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  activeAlerts: Alert[];
  onNavigateToAlerts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  isConnected,
  activeScenario,
  onScenarioChange,
  activeAlerts,
  onNavigateToAlerts
}) => {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Twin Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">MobileTwin</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                CAPSTONE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Digital Twin SHM System</p>
          </div>
        </div>

        {/* Center: Scenario Switcher Control */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider">
            Sim Scenario:
          </span>
          <button
            onClick={() => onScenarioChange('normal')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeScenario === 'normal'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Normal Baseline
          </button>
          <button
            onClick={() => onScenarioChange('warning')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeScenario === 'warning'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Warning Surge
          </button>
          <button
            onClick={() => onScenarioChange('critical')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeScenario === 'critical'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Critical Peak
          </button>
        </div>

        {/* Right: Live Socket Dot, Notification Bell, User Badge */}
        <div className="flex items-center space-x-4">
          {/* Real-time Socket Status */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-amber-400 animate-pulse'
              }`}
            ></span>
            <span className="font-mono text-[11px]">{isConnected ? 'LIVE TWIN (ONLINE)' : 'INITIALIZING...'}</span>
          </div>

          {/* Active Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {/* Dropdown Notification Menu */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200">Active Structural Alerts</span>
                  <span className="text-[10px] text-slate-400">{activeAlerts.length} Active</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 my-2">
                  {activeAlerts.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 flex flex-col items-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                      <span>Zero active alerts</span>
                    </div>
                  ) : (
                    activeAlerts.map((a) => (
                      <div
                        key={a.id}
                        className={`p-2 rounded-lg border text-left ${
                          a.alert_level === 'critical'
                            ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                            : 'bg-amber-950/40 border-amber-800 text-amber-200'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{a.title}</span>
                          <span className="text-[10px] uppercase font-mono">{a.alert_level}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
                {onNavigateToAlerts && (
                  <button
                    onClick={() => {
                      setShowNotificationMenu(false);
                      onNavigateToAlerts();
                    }}
                    className="w-full py-1.5 text-center text-cyan-400 font-semibold hover:bg-slate-800 rounded transition-colors text-xs"
                  >
                    Open Alert Management →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          {user && (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-200">{user.full_name.split(' ')[0]}</div>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    user.role === 'admin' ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
