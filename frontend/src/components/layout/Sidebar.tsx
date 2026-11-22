import React from 'react';
import {
  LayoutDashboard,
  Box,
  Activity,
  History,
  AlertTriangle,
  Sliders,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { HealthStatus, UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeAlertCount: number;
  healthScore: number;
  healthStatus: HealthStatus;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeAlertCount,
  healthScore,
  healthStatus,
  userRole = 'engineer'
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'digital-twin', label: '3D Digital Twin', icon: Box },
    { id: 'sensors', label: 'Sensor Telemetry', icon: Activity },
    { id: 'historical', label: 'Historical Analytics', icon: History },
    { id: 'alerts', label: 'Alerts & Incidents', icon: AlertTriangle, badge: activeAlertCount },
    { id: 'thresholds', label: 'Threshold Settings', icon: Sliders, adminOnly: true },
    { id: 'profile', label: 'Profile & Architecture', icon: User },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 hidden lg:flex lg:flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Monitoring Modules
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isRestricted = item.adminOnly && userRole !== 'admin';

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.adminOnly && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Infrastructure Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Asset</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              healthStatus === 'healthy'
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : healthStatus === 'warning'
                ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
            }`}
          ></span>
        </div>
        <div className="text-xs font-bold text-white truncate">Saline River Bridge</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Length: 188.6m | 3-Span Cable-Stayed</div>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Health:</span>
          <span className="font-mono font-bold text-white">{healthScore.toFixed(1)} / 100</span>
        </div>
      </div>
    </aside>
  );
};
