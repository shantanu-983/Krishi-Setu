import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

export default function Navbar({ activeEngine, onSelectEngine }) {
  const [backendHealth, setBackendHealth] = useState({ status: 'checking' });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;

    function queryHealth() {
      api.getHealth()
        .then((res) => {
          if (!isMounted) return;
          if (res.ok) {
            setBackendHealth({ status: 'connected', data: res.data });
          } else {
            setBackendHealth({ status: 'error', error: res.error });
          }
        })
        .catch(() => {
          if (isMounted) setBackendHealth({ status: 'error' });
        });
    }

    queryHealth();
    const interval = setInterval(queryHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { key: 'mandi', label: 'Smart Mandi', icon: 'ri-scales-3-line' },
    { key: 'crop', label: 'Crop Opportunity', icon: 'ri-plant-line' },
    { key: 'weather', label: 'Climate Risk', icon: 'ri-cloud-windy-line' },
    { key: 'schemes', label: 'Govt Schemes', icon: 'ri-government-line' },
    { key: 'village', label: 'Village Dashboard', icon: 'ri-community-line' },
  ];

  return (
    <>
      <header className="w-full py-4 px-6 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        {/* Brand Badge */}
        <div className="flex items-center gap-3">
          <a href="#hero" className="flex items-center gap-2 group">
            <span className="bg-black text-white uppercase px-5 py-2 rounded-full font-bold text-xs tracking-widest flex items-center gap-1.5 shadow-sm group-hover:bg-gray-800 transition">
              🌱 Krishi Setu
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Decision-Support Platform
            </span>
          </a>
        </div>

        {/* Engine Navigation Pills */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectEngine(item.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap flex items-center gap-1.5 ${
                activeEngine === item.key
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className={item.icon}></i> {item.label}
            </button>
          ))}
        </nav>

        {/* Right side: Auth Profile / Sign In & Live Health Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Profile / Login Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <div className="text-left font-medium text-emerald-950">
                <span className="font-bold">{user.name}</span>
                {user.district && <span className="text-[11px] text-emerald-700 ml-1">({user.district})</span>}
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="ml-1 text-emerald-700 hover:text-red-600 transition"
              >
                <i className="ri-logout-box-r-line"></i>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              <i className="ri-user-line"></i> Sign In / Register
            </button>
          )}

          {/* Backend Status Live Pill */}
          {backendHealth.status === 'connected' ? (
            <span className="inline-flex items-center gap-1.5 bg-gray-50 text-emerald-800 border border-gray-200 px-2.5 py-1.5 rounded-full text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              API Live
            </span>
          ) : backendHealth.status === 'checking' ? (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-full text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-ping"></span>
              Checking...
            </span>
          ) : (
            <span
              title="Unable to reach backend at http://localhost:3000/api/v1"
              className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-help"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Offline
            </span>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
