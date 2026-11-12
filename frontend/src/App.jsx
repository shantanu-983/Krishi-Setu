import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import ProfileModal from './components/profile/ProfileModal';
import ProfileView from './components/profile/ProfileView';
import AuthModal from './components/auth/AuthModal';

// Engines & Pages
import HomeDashboard from './components/dashboard/HomeDashboard';
import MandiEngine from './components/mandi/MandiEngine';
import CropEngine from './components/crop/CropEngine';
import WeatherEngine from './components/weather/WeatherEngine';
import ScheduleEngine from './components/schedule/ScheduleEngine';
import SchemesEngine from './components/schemes/SchemesEngine';
import VillageDashboard from './components/village/VillageDashboard';
import AIAssistant from './components/ai/AIAssistant';
import api from './api/client';

function MainAppShell() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals & Drawers state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(3);

  // Initial fetch of unread count
  useEffect(() => {
    api.getNotifications()
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          let readIds = [];
          try {
            readIds = JSON.parse(localStorage.getItem('krishi_read_notifications') || '[]');
          } catch {
            readIds = [];
          }
          const unread = res.data.filter((n) => !readIds.includes(n.id)).length;
          setUnreadNotificationsCount(unread);
        }
      })
      .catch((err) => {
        console.debug('Failed to fetch notifications unread count:', err);
      });
  }, []);

  function handleSelectTab(tabKey) {
    setActiveTab(tabKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#eef4f7] dark:bg-[#0c121e] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors flex flex-col">
      {/* 1. SaaS Collapsible / Mobile Responsive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Content Wrapper (offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenProfile={() => handleSelectTab('profile')}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSelectTab={handleSelectTab}
          onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <HomeDashboard
              onSelectTab={handleSelectTab}
              onOpenProfile={() => handleSelectTab('profile')}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {activeTab === 'mandi' && <MandiEngine />}
          {activeTab === 'crop' && <CropEngine />}
          {activeTab === 'weather' && <WeatherEngine />}
          {activeTab === 'schedule' && <ScheduleEngine />}
          {activeTab === 'schemes' && <SchemesEngine />}
          {activeTab === 'village' && <VillageDashboard />}
          {activeTab === 'ai-assistant' && <AIAssistant />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* Global Footer (matching screenshots) */}
        <footer className="mt-auto border-t border-slate-200/50 dark:border-slate-800/80 py-5 px-4 sm:px-8 text-xs text-slate-400 dark:text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Krishi Setu • Growing better, together.
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>Kukrail, Uttar Pradesh • Rabi 2026–27</span>
              <span>•</span>
              <a
                href="http://localhost:3000/api/v1/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Swagger API
              </a>
              <span>•</span>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Open-Meteo
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* 3. Global Notification Center Slide-over */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onSelectTab={handleSelectTab}
        onUpdateUnreadCount={(count) => setUnreadNotificationsCount(count)}
      />

      {/* 4. Farmer Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* 5. Authentication (Login / Register) Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainAppShell />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
