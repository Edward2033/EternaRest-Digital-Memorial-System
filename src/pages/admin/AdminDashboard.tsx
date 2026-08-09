import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { DashboardStats, Booking, Memorial, Comment } from '@/lib/types';
import AdminLayout from '@/components/ui/AdminLayout';

type Tab = 'overview' | 'bookings' | 'memorials' | 'comments';

// ─── Shared UI atoms ────────────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-[#d4af37]/20" />
      <div className="absolute inset-0 rounded-full border-4 border-[#d4af37] border-t-transparent animate-spin" />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    approved:  'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300',
    rejected:  'bg-red-100 text-red-700 ring-1 ring-red-300',
    pending:   'bg-amber-100 text-amber-700 ring-1 ring-amber-300',
    published: 'bg-blue-100 text-blue-700 ring-1 ring-blue-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ label, value, sub, subColor = 'text-gray-400', icon, iconBg }: StatCardProps) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-[#0d1117] tabular-nums">{value}</p>
        {sub && <p className={`mt-1 text-xs font-medium ${subColor}`}>{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="py-20 text-center text-gray-400">
    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <p className="text-sm">{message}</p>
  </div>
);

// ─── Tab nav ──────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'bookings',  label: 'Bookings'  },
  { id: 'memorials', label: 'Memorials' },
  { id: 'comments',  label: 'Comments'  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ initialTab }: { initialTab?: Tab }) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'overview');
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [qrStatus,  setQrStatus]  = useState<Record<string, string>>({});
  const [qrLoading, setQrLoading] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, bookingsRes] = await Promise.all([api.getStats(), api.getBookings()]);
        if (statsRes.success)    setStats(statsRes.data);
        if (bookingsRes.success) setBookings(bookingsRes.data.slice(0, 5));
      } else if (activeTab === 'bookings') {
        const res = await api.getBookings();
        if (res.success) setBookings(res.data);
      } else if (activeTab === 'memorials') {
        const res = await api.getMemorials();
        if (res.success) setMemorials(res.data);
      } else if (activeTab === 'comments') {
        const res = await api.getComments();
        if (res.success) setComments(res.data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/admin');
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const handleBookingStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await api.updateBookingStatus(id, status);
      if (res.success) loadData();
    } catch (err) { console.error('Failed to update booking:', err); }
  };

  const handleRegenerateQR = async (bookingId: string) => {
    setQrLoading(p => ({ ...p, [bookingId]: true }));
    try {
      const res = await api.regenerateQR(bookingId);
      if (res.success) setQrStatus(p => ({ ...p, [bookingId]: 'active' }));
    } catch (err) { console.error('QR regen failed:', err); }
    setQrLoading(p => ({ ...p, [bookingId]: false }));
  };

  const handleCommentModeration = async (id: string, approve: boolean) => {
    try {
      await api.moderateComment(id, approve);
      loadData();
    } catch (err) { console.error('Failed to moderate comment:', err); }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (isLoading) return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center"><Spinner /></div>
  );

  return (
    <AdminLayout onRefresh={loadData}>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-[#0d1117] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Total Bookings" value={stats?.totalBookings ?? 0}
                  sub={`${stats?.pendingBookings ?? 0} pending`} subColor="text-amber-500"
                  iconBg="bg-blue-50"
                  icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                <StatCard
                  label="Pending Bookings" value={stats?.pendingBookings ?? 0}
                  sub="Awaiting review" subColor="text-amber-500"
                  iconBg="bg-amber-50"
                  icon={<svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                  label="Approved Bookings" value={stats?.approvedBookings ?? 0}
                  sub="Confirmed" subColor="text-emerald-500"
                  iconBg="bg-emerald-50"
                  icon={<svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                  label="Total Memorials" value={stats?.totalMemorials ?? 0}
                  sub={`${stats?.publishedMemorials ?? 0} published`} subColor="text-purple-500"
                  iconBg="bg-purple-50"
                  icon={<svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Revenue" value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
                  sub="All time" subColor="text-[#b8960c]"
                  iconBg="bg-[#d4af37]/10"
                  icon={<svg className="w-6 h-6 text-[#b8960c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                  label="Available Niches" value={stats?.availableNiches ?? 0}
                  sub={`${stats?.occupiedNiches ?? 0} occupied`}
                  iconBg="bg-teal-50"
                  icon={<svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
                <StatCard
                  label="Pending Comments" value={stats?.pendingComments ?? 0}
                  sub="Needs review" subColor="text-amber-500"
                  iconBg="bg-orange-50"
                  icon={<svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-[#0d1117]">Recent Bookings</h2>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs text-[#d4af37] hover:text-[#b8960c] font-semibold transition-colors">
                    View all →
                  </button>
                </div>
                {bookings.length === 0 ? <EmptyState message="No bookings yet" /> : (
                  <div className="divide-y divide-gray-50">
                    {bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#b8960c] font-bold text-sm flex-shrink-0">
                            {b.deceased_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0d1117] text-sm">{b.deceased_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">By {b.requester_name} · {fmt(b.created_at)}</p>
                          </div>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BOOKINGS ──────────────────────────────────────────────────────── */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#0d1117]">All Bookings</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{bookings.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Booking ID', 'Deceased', 'Requester', 'Location', 'Status', 'QR', 'Date', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{b.booking_id}</td>
                        <td className="px-5 py-4 font-semibold text-[#0d1117] whitespace-nowrap">{b.deceased_name}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-gray-700 font-medium">{b.requester_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{b.requester_email}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                            W{b.preferred_wall} R{b.preferred_row} S{b.preferred_slot}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={b.status} /></td>
                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">{fmt(b.created_at)}</td>
                        {/* QR column */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {b.status === 'approved' ? (
                            <div className="flex gap-1.5">
                              {b.qr_code && (
                                <button onClick={() => api.downloadQR(b.booking_id)}
                                  className="p-1.5 rounded-lg bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#b8960c] transition-all" title="Download QR">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </button>
                              )}
                              <button onClick={() => handleRegenerateQR(b.booking_id)}
                                disabled={qrLoading[b.booking_id]}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all disabled:opacity-50" title="Regenerate QR">
                                <svg className={`w-3.5 h-3.5 ${qrLoading[b.booking_id] ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              </button>
                            </div>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {b.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleBookingStatus(b.id, 'approved')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition-all shadow-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                Approve
                              </button>
                              <button onClick={() => handleBookingStatus(b.id, 'rejected')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 active:scale-95 transition-all">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                Reject
                              </button>
                            </div>
                          ) : <span className="text-xs text-gray-300 italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookings.length === 0 && <EmptyState message="No bookings found" />}
              </div>
            </div>
          )}

          {/* ── MEMORIALS ────────────────────────────────────────────────────── */}
          {activeTab === 'memorials' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#0d1117]">All Memorials</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{memorials.length} total</span>
              </div>
              {memorials.length === 0 ? <EmptyState message="No memorials found" /> : (
                <div className="divide-y divide-gray-50">
                  {memorials.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                          {m.deceased_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0d1117]">{m.deceased_name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{m.memorial_id}</p>
                          <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                            <span>{m.media?.length ?? 0} media</span>
                            <span>{m.tributes?.length ?? 0} tributes</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={m.is_published ? 'published' : 'pending'} />
                        <Link to={`/memorial/${m.memorial_id}`}
                          className="p-2 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] transition-all" title="View Memorial">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COMMENTS ─────────────────────────────────────────────────────── */}
          {activeTab === 'comments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#0d1117]">Comment Moderation</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{comments.length} total</span>
              </div>
              {comments.length === 0 ? <EmptyState message="No comments found" /> : (
                <div className="divide-y divide-gray-50">
                  {comments.map((c) => (
                    <div key={c.id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                            {c.author_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-semibold text-[#0d1117] text-sm">{c.author_name}</span>
                              <span className="text-gray-300 text-xs">on</span>
                              <span className="text-[#d4af37] text-xs font-medium">{c.memorials?.deceased_name}</span>
                              <StatusBadge status={c.is_approved ? 'approved' : 'pending'} />
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{c.content}</p>
                            <p className="text-xs text-gray-400 mt-2">{fmt(c.created_at)}</p>
                          </div>
                        </div>
                        {!c.is_approved && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleCommentModeration(c.id, true)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition-all shadow-sm">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              Approve
                            </button>
                            <button onClick={() => handleCommentModeration(c.id, false)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 active:scale-95 transition-all">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
