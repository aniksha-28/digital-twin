import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Radio, Lock, User as UserIcon, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login(username, password);
      localStorage.setItem('mobiletwin_token', res.token);
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoUser: 'admin' | 'engineer') => {
    if (demoUser === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('engineer');
      setPassword('engineer123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 items-center justify-center shadow-xl shadow-cyan-900/40 mb-3">
          <Radio className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">MobileTwin Portal</h2>
        <p className="text-xs text-slate-400 mt-1">
          Digital Twin-Based Mobile Monitoring System for Smart Infrastructure
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full text-slate-900 font-medium"
                  placeholder="admin or engineer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full text-slate-900 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Access Twin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Pre-fill Pills */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Capstone Demo Profiles (Click to fill)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-xs"
              >
                <div className="font-bold text-slate-800">Admin Account</div>
                <div className="text-[10px] text-slate-500 font-mono">admin / admin123</div>
                <span className="text-[9px] text-indigo-600 font-bold">Full Config Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('engineer')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 transition-all text-xs"
              >
                <div className="font-bold text-slate-800">Engineer Account</div>
                <div className="text-[10px] text-slate-500 font-mono">engineer / engineer123</div>
                <span className="text-[9px] text-cyan-600 font-bold">Monitor & Acknowledge</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          Powered by Flask, Three.js, React, SQLite & Zenodo SHM Dataset
        </div>
      </div>
    </div>
  );
};
