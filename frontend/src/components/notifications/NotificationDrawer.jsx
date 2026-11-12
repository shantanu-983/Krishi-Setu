import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';

export default function NotificationDrawer({
  isOpen,
  onClose,
  onSelectTab,
  onUpdateUnreadCount,
}) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('krishi_read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    api.getNotifications()
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && Array.isArray(res.data)) {
          setNotifications(res.data);
          const unread = res.data.filter((n) => !n.isRead && !readIds.includes(n.id)).length;
          if (onUpdateUnreadCount) onUpdateUnreadCount(unread);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function markAllAsRead() {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      localStorage.setItem('krishi_read_notifications', JSON.stringify(allIds));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    if (onUpdateUnreadCount) onUpdateUnreadCount(0);
    api.markAllNotificationsRead().catch((err) => {
      console.debug('Backend markAllNotificationsRead handled:', err);
    });
  }

  function handleAction(actionKey, notificationId) {
    if (!readIds.includes(notificationId)) {
      const nextRead = [...readIds, notificationId];
      setReadIds(nextRead);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      try {
        localStorage.setItem('krishi_read_notifications', JSON.stringify(nextRead));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      const unread = notifications.filter((n) => n.id !== notificationId && !n.isRead && !nextRead.includes(n.id)).length;
      if (onUpdateUnreadCount) onUpdateUnreadCount(unread);
      api.markNotificationRead(notificationId).catch((err) => {
        console.debug('Backend markNotificationRead handled:', err);
      });
    }

    onClose();
    if (actionKey === 'WEATHER' || actionKey === 'CLIMATE') {
      onSelectTab('weather');
    } else if (actionKey === 'TASK' || actionKey === 'SCHEDULE') {
      onSelectTab('schedule');
    } else if (actionKey === 'SCHEME') {
      onSelectTab('schemes');
    } else if (actionKey === 'MANDI') {
      onSelectTab('mandi');
    }
  }

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#111927] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xl">
                <i className="ri-notification-3-line"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t('notifications')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadCount > 0
                    ? `${unreadCount} ${t('unreadAlerts') || 'unread alerts'}`
                    : t('allCaughtUp') || 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-1"
                >
                  {t('markAllRead') || 'Mark all read'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('loadingAlerts') || 'Checking live advisories and farm updates...'}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-3xl mx-auto">
                  <i className="ri-checkbox-circle-line"></i>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('noNewNotifications') || 'No new alerts'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {t('noNotificationsDesc') || 'Your fields and mandi prices are stable. Check back soon for weather warnings and scheme deadlines.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.includes(item.id);
                const severity = item.severity || 'INFO';
                const isAlert = severity === 'ALERT' || severity === 'CRITICAL';
                const isWarning = severity === 'WARNING';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isRead
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                        : isAlert
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                        : isWarning
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isAlert
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                              : isWarning
                              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                              : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          {item.category || severity}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    {item.actionType && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {item.actionLabel || 'Action required'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAction(item.actionType, item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline"
                        >
                          <span>{t('viewNow') || 'View Now'}</span>
                          <i className="ri-arrow-right-s-line"></i>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111927]">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              Alerts update dynamically from Open-Meteo, ICAR Crop Calendar & APMC Mandis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
