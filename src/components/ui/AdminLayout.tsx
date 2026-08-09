import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':    'Dashboard',
  '/admin/bookings':     'Bookings',
  '/admin/memorials':    'Memorials',
  '/admin/payments':     'Payments',
  '/admin/services':     'Services',
  '/admin/banners':      'Banners',
  '/admin/heroslides':   'Hero Slides',
  '/admin/testimonials': 'Testimonials',
  '/admin/gallery':      'Gallery',
  '/admin/faqs':         'FAQs',
  '/admin/packages':     'Packages',
  '/admin/users':        'Users',
  '/admin/messages':     'Messages',
  '/admin/settings':     'Settings',
};

interface AdminLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export default function AdminLayout({ children, onRefresh }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin';

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden">

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h1 className="text-[17px] font-bold text-[#0d1117] leading-none">{pageTitle}</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">EternaRest Management Panel</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh data"
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#d4af37] transition-all duration-150"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {/* Notification bell */}
            <button
              title="Notifications"
              className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Red dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Avatar + name */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {(user?.full_name ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold text-gray-800 leading-none">{user?.full_name ?? 'Admin'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
