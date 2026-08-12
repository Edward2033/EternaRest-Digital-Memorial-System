import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/ui/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdminFAQs } from './AdminCMS';

export { AdminFAQs };

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function useToken() { return localStorage.getItem('eternarest_token') ?? ''; }

function useAdminGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!isLoading && !isAuthenticated) navigate('/admin'); }, [isAuthenticated, isLoading, navigate]);
  return { ready: !isLoading && isAuthenticated };
}

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-[#d4af37]/20" />
      <div className="absolute inset-0 rounded-full border-4 border-[#d4af37] border-t-transparent animate-spin" />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-700', completed: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700',
    active: 'bg-blue-100 text-blue-700', inactive: 'bg-gray-100 text-gray-500',
    replied: 'bg-purple-100 text-purple-700', new: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface Payment {
  _id: string; paymentId: string; bookingId: string; billingNumber: string;
  packageName: string; amount: number; currency: string; method: string;
  phoneNumber: string; status: string; transactionId?: string;
  transactionReference?: string; verifiedBy?: string; verifiedAt?: string;
  paidAt?: string; notes?: string; createdAt: string;
}

interface Invoice {
  _id: string; invoiceNumber: string; bookingId: string; amount: number;
  currency: string; status: string; notes?: string; createdAt: string;
}

const METHOD_COLORS: Record<string, string> = {
  mtn:    'bg-yellow-50 text-yellow-700 border border-yellow-200',
  airtel: 'bg-red-50 text-red-600 border border-red-200',
  cash:   'bg-green-50 text-green-700 border border-green-200',
  card:   'bg-blue-50 text-blue-600 border border-blue-200',
  other:  'bg-gray-100 text-gray-500 border border-gray-200',
};

export function AdminPayments() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems]       = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [drawer, setDrawer]     = useState<Payment | null>(null);
  const [invoice, setInvoice]   = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter !== 'all' ? `${BASE}/payments?status=${filter}` : `${BASE}/payments`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (json.success) setItems(json.payments ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openDrawer = async (p: Payment) => {
    setDrawer(p);
    setInvoice(null);
    setInvoiceLoading(true);
    try {
      const r = await fetch(`${BASE}/payments/${p._id}/invoice`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (json.success) setInvoice(json.invoice);
    } catch { /* silent */ }
    setInvoiceLoading(false);
  };

  const handleVerify = async (p: Payment) => {
    setVerifying(p._id);
    setVerifyMsg(null);
    try {
      const r = await fetch(`${BASE}/payments/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: p.bookingId }),
      });
      const json = await r.json();
      const ok = json.status === 'SUCCESSFUL' || json.alreadyVerified;
      setVerifyMsg({ id: p._id, msg: ok ? '✓ Payment verified — memorial is live' : json.message || 'Still pending', ok });
      if (ok) { load(); if (drawer?._id === p._id) setDrawer(prev => prev ? { ...prev, status: 'verified' } : prev); }
    } catch { setVerifyMsg({ id: p._id, msg: 'Verification failed', ok: false }); }
    setVerifying(null);
  };

  if (!ready) return null;

  const FILTERS = ['all', 'pending', 'verified', 'completed', 'failed'];

  const filtered = items.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.bookingId?.toLowerCase().includes(q) ||
           p.billingNumber?.toLowerCase().includes(q) ||
           p.phoneNumber?.toLowerCase().includes(q) ||
           p.transactionId?.toLowerCase().includes(q);
  });

  // Stats
  const total     = items.length;
  const verified  = items.filter(p => p.status === 'verified' || p.status === 'completed').length;
  const pending   = items.filter(p => p.status === 'pending').length;
  const failed    = items.filter(p => p.status === 'failed').length;
  const revenue   = items.filter(p => p.status === 'verified' || p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <AdminLayout onRefresh={load}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0d1117]">Payments</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} total records</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
          placeholder="Search booking ID, phone…" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',    value: total,    color: 'bg-gray-50 text-gray-700' },
          { label: 'Verified', value: verified, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pending',  value: pending,  color: 'bg-amber-50 text-amber-700' },
          { label: 'Failed',   value: failed,   color: 'bg-red-50 text-red-600' },
          { label: 'Revenue',  value: `RWF ${revenue.toLocaleString()}`, color: 'bg-[#d4af37]/10 text-[#b8960c]' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-[#0d1117] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>{f}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Booking / Billing', 'Amount', 'Method', 'Phone', 'Transaction ID', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-mono text-xs font-semibold text-[#0d1117]">{p.bookingId}</p>
                      <p className="font-mono text-xs text-gray-400 mt-0.5">{p.billingNumber || '—'}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#0d1117] whitespace-nowrap">
                      {p.currency} {p.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase ${METHOD_COLORS[p.method] ?? METHOD_COLORS.other}`}>
                        {p.method || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{p.phoneNumber || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-400 max-w-[130px]">
                      <span className="truncate block" title={p.transactionId}>{p.transactionId || '—'}</span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{fmt(p.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* View details */}
                        <button onClick={() => openDrawer(p)} title="View details"
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {/* Manual verify — only for pending */}
                        {p.status === 'pending' && (
                          <button onClick={() => handleVerify(p)} disabled={verifying === p._id} title="Verify payment"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all disabled:opacity-50">
                            {verifying === p._id
                              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            }
                          </button>
                        )}
                      </div>
                      {/* Inline verify feedback */}
                      {verifyMsg?.id === p._id && (
                        <p className={`text-xs mt-1 font-medium ${verifyMsg.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{verifyMsg.msg}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-20 text-center text-gray-400 text-sm">No payment records found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-[#0d1117]">Payment Detail</h3>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{drawer.paymentId || drawer._id}</p>
              </div>
              <button onClick={() => setDrawer(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Status banner */}
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
                drawer.status === 'verified' || drawer.status === 'completed' ? 'bg-emerald-50 border border-emerald-200' :
                drawer.status === 'pending' ? 'bg-amber-50 border border-amber-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div>
                  <p className="text-xs font-medium opacity-60 uppercase tracking-wide">Status</p>
                  <p className="font-bold text-lg capitalize mt-0.5">{drawer.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium opacity-60 uppercase tracking-wide">Amount</p>
                  <p className="font-bold text-xl mt-0.5">{drawer.currency} {drawer.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {[
                  ['Booking ID',    drawer.bookingId],
                  ['Billing #',     drawer.billingNumber || '—'],
                  ['Package',       drawer.packageName || '—'],
                  ['Method',        (drawer.method || '—').toUpperCase()],
                  ['Phone',         drawer.phoneNumber || '—'],
                  ['Transaction ID',drawer.transactionId || drawer.transactionReference || '—'],
                  ['Verified By',   drawer.verifiedBy || '—'],
                  ['Verified At',   drawer.verifiedAt ? fmt(drawer.verifiedAt) : '—'],
                  ['Paid At',       drawer.paidAt ? fmt(drawer.paidAt) : '—'],
                  ['Created',       fmt(drawer.createdAt)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">{label}</span>
                    <span className="text-xs text-gray-700 font-semibold text-right font-mono break-all">{val}</span>
                  </div>
                ))}
                {drawer.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-medium mb-1">Notes</p>
                    <p className="text-xs text-gray-600">{drawer.notes}</p>
                  </div>
                )}
              </div>

              {/* Invoice section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Invoice</p>
                {invoiceLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Loading invoice…
                  </div>
                ) : invoice ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Invoice #</span>
                      <span className="text-xs font-mono font-semibold text-[#0d1117]">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Amount</span>
                      <span className="text-xs font-bold text-[#0d1117]">{invoice.currency} {invoice.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Status</span>
                      <StatusBadge status={invoice.status} />
                    </div>
                    {invoice.notes && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">{invoice.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No invoice found for this payment.</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
                {drawer.status === 'pending' && (
                  <button onClick={() => handleVerify(drawer)} disabled={verifying === drawer._id}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {verifying === drawer._id
                      ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Verifying…</>
                      : '✓ Verify & Approve Payment'
                    }
                  </button>
                )}
                {verifyMsg?.id === drawer._id && (
                  <p className={`text-sm font-medium text-center ${verifyMsg.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{verifyMsg.msg}</p>
                )}
                <a href={`/memorial/${drawer.bookingId}`} target="_blank" rel="noreferrer"
                  className="w-full py-2.5 bg-[#d4af37]/10 text-[#b8960c] rounded-xl text-sm font-semibold hover:bg-[#d4af37]/20 transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  View Memorial Page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (Family Accounts)
// ═══════════════════════════════════════════════════════════════════════════════

interface FamilyUser {
  _id: string;
  primaryContactName: string;
  email: string;
  phone: string;
  bookingIds: string[];
  isActive: boolean;
  createdAt: string;
}

export function AdminUsers() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<FamilyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/family`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (json.success) setItems(json.accounts ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0d1117]">Family Accounts</h2>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} accounts</p>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Primary Contact', 'Email', 'Phone', 'Bookings', 'Status', 'Registered'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#0d1117]">{u.primaryContactName}</td>
                    <td className="px-5 py-4 text-gray-500">{u.email}</td>
                    <td className="px-5 py-4 text-gray-500">{u.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                        {u.bookingIds?.length ?? 0} booking{(u.bookingIds?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{fmt(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="py-20 text-center text-gray-400 text-sm">No family accounts yet. They are created automatically when a booking is approved.</div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES (Contact Form Submissions)
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  _id: string; name: string; email: string; phone?: string;
  subject?: string; message: string; status: string; createdAt: string;
}

export function AdminMessages() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (json.success) setItems(json.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  const markReplied = async (id: string) => {
    try {
      await fetch(`${BASE}/admin/contacts/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'replied' }),
      });
      load();
    } catch { /* silent */ }
  };

  const deleteMessage = async (id: string) => {
    try {
      await fetch(`${BASE}/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch { /* silent */ }
  };

  useEffect(() => { if (ready) load(); }, [ready, load]);

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0d1117]">Contact Messages</h2>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} messages</p>
        </div>
      </div>
      {loading ? <Spinner /> : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center text-gray-400 text-sm">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map(m => (
            <div key={m._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(expanded === m._id ? null : m._id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#b8960c] font-bold text-sm flex-shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0d1117] text-sm">{m.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{m.subject || m.message.substring(0, 50)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <StatusBadge status={m.status || 'new'} />
                  <span className="text-xs text-gray-400">{fmt(m.createdAt)}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === m._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {expanded === m._id && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="grid grid-cols-2 gap-4 mt-4 mb-4 text-sm">
                    <div><span className="text-xs text-gray-400 uppercase tracking-wide">Email</span><p className="text-gray-700 mt-0.5">{m.email}</p></div>
                    <div><span className="text-xs text-gray-400 uppercase tracking-wide">Phone</span><p className="text-gray-700 mt-0.5">{m.phone || '—'}</p></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{m.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {m.status !== 'replied' && (
                      <button onClick={() => markReplied(m._id)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-all">
                        Mark as Replied
                      </button>
                    )}
                    <a href={`mailto:${m.email}?subject=Re: ${m.subject || 'Your message to EternaRest'}`}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all">
                      Reply via Email
                    </a>
                    <button onClick={() => deleteMessage(m._id)}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all ml-auto">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGES
// ═══════════════════════════════════════════════════════════════════════════════

interface Package {
  _id: string; name: string; displayName: string; price: number;
  description: string; features: string[]; badge: string; featured: boolean;
  isActive: boolean; sortOrder: number;
}

export function AdminPackages() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState<Omit<Package, '_id'>>({
    name: '', displayName: '', price: 0, description: '', features: [],
    badge: '', featured: false, isActive: true, sortOrder: 0,
  });
  const [featuresRaw, setFeaturesRaw] = useState('');
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/packages`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (json.success) setItems(json.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => {
    setForm({ name: '', displayName: '', price: 0, description: '', features: [], badge: '', featured: false, isActive: true, sortOrder: items.length });
    setFeaturesRaw('');
    setModal('add');
  };

  const openEdit = (p: Package) => {
    setEditId(p._id);
    setForm({ name: p.name, displayName: p.displayName, price: p.price, description: p.description ?? '', features: p.features ?? [], badge: p.badge ?? '', featured: p.featured, isActive: p.isActive, sortOrder: p.sortOrder });
    setFeaturesRaw((p.features ?? []).join('\n'));
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    const features = featuresRaw.split('\n').map(f => f.trim()).filter(Boolean);
    const payload = { ...form, features };
    try {
      if (modal === 'add') {
        await fetch(`${BASE}/admin/packages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${BASE}/admin/packages/${editId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
    } catch { /* silent */ }
    setSaving(false); setModal(null); load();
  };

  const del = async () => {
    try {
      await fetch(`${BASE}/admin/packages/${delId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    } catch { /* silent */ }
    setDelId(''); load();
  };

  if (!ready) return null;

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] transition-all placeholder:text-gray-300";
  const Field2 = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );

  return (
    <AdminLayout onRefresh={load}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0d1117]">Packages</h2>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} packages</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1117] text-white text-sm font-semibold hover:bg-[#1a2332] transition-all shadow-sm self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Package
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Name', 'Price', 'Features', 'Badge', 'Status', 'Order', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#0d1117]">{p.displayName || p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.name}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#b8960c]">{p.price?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{(p.features ?? []).length} items</td>
                    <td className="px-5 py-4">
                      {p.badge ? <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium">{p.badge}</span> : <span className="text-gray-300 text-xs italic">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 tabular-nums">{p.sortOrder}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setDelId(p._id)} className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <div className="py-20 text-center text-gray-400 text-sm">No packages yet.</div>}
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-[#0d1117] text-lg">{modal === 'add' ? 'Add Package' : 'Edit Package'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field2 label="Internal Name (slug)">
                  <input className={inputCls} value={form.name} readOnly={modal === 'edit'} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="essential" />
                </Field2>
                <Field2 label="Display Name">
                  <input className={inputCls} value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Essential" />
                </Field2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field2 label="Price (RWF)">
                  <input type="number" className={inputCls} value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </Field2>
                <Field2 label="Badge (optional)">
                  <input className={inputCls} value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} placeholder="Popular" />
                </Field2>
              </div>
              <Field2 label="Description">
                <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Package description" />
              </Field2>
              <Field2 label="Features (one per line)">
                <textarea className={inputCls} rows={5} value={featuresRaw} onChange={e => setFeaturesRaw(e.target.value)} placeholder={"Memorial page\nQR code\nUp to 10 photos"} />
              </Field2>
              <div className="grid grid-cols-3 gap-4">
                <Field2 label="Sort Order">
                  <input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
                </Field2>
                <Field2 label="Featured">
                  <label className="flex items-center gap-2 h-[42px] cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
                    <span className="text-sm text-gray-700">Featured</span>
                  </label>
                </Field2>
                <Field2 label="Active">
                  <label className="flex items-center gap-2 h-[42px] cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </Field2>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d1117] text-white text-sm font-semibold hover:bg-[#1a2332] transition-all disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDelId('')} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="text-center text-sm text-gray-600">Delete this package? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId('')} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={del} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE CONTENT MANAGER
// Manages all text + images for Home, About, Contact pages via Settings keys
// ═══════════════════════════════════════════════════════════════════════════════

import { uploadCMSImage } from '@/hooks/useCMS';

const PAGE_SECTIONS = [
  {
    page: 'Home Page',
    color: 'blue',
    fields: [
      { key: 'home_hero_title',       label: 'Hero Title',           type: 'text',     hint: 'e.g. Honoring Lives,' },
      { key: 'home_hero_highlight',   label: 'Hero Highlight Text',  type: 'text',     hint: 'e.g. Preserving Memories' },
      { key: 'home_hero_description', label: 'Hero Description',     type: 'textarea', hint: 'Subtitle below the hero heading' },
      { key: 'home_hero_image',       label: 'Hero Background Image',type: 'image',    hint: 'Full-width hero background photo' },
      { key: 'home_hero_btn1_text',   label: 'Button 1 Text',        type: 'text',     hint: 'e.g. Book a Niche' },
      { key: 'home_hero_btn1_link',   label: 'Button 1 Link',        type: 'text',     hint: 'e.g. /book' },
      { key: 'home_hero_btn2_text',   label: 'Button 2 Text',        type: 'text',     hint: 'e.g. Search Memorial' },
      { key: 'home_hero_btn2_link',   label: 'Button 2 Link',        type: 'text',     hint: 'e.g. /search' },
      { key: 'home_services_title',   label: 'Services Section Title',type: 'text',    hint: 'e.g. Our Services' },
      { key: 'home_services_subtitle',label: 'Services Subtitle',    type: 'textarea', hint: 'Short description under the title' },
      { key: 'home_garden_title',     label: 'Garden Section Title', type: 'text',     hint: 'e.g. Our Memorial Gardens' },
      { key: 'home_garden_subtitle',  label: 'Garden Subtitle',      type: 'textarea', hint: 'Short description under the title' },
      { key: 'home_garden_image_1',   label: 'Garden Photo 1 (Large)',type: 'image',   hint: 'Main large garden photo' },
      { key: 'home_garden_image_2',   label: 'Garden Photo 2',       type: 'image',    hint: '' },
      { key: 'home_garden_image_3',   label: 'Garden Photo 3',       type: 'image',    hint: '' },
      { key: 'home_garden_image_4',   label: 'Garden Photo 4',       type: 'image',    hint: '' },
      { key: 'home_garden_image_5',   label: 'Garden Photo 5',       type: 'image',    hint: '' },
      { key: 'home_garden_image_6',   label: 'Garden Photo 6',       type: 'image',    hint: '' },
      { key: 'home_testimonials_title',label: 'Testimonials Title',  type: 'text',     hint: 'e.g. What Families Say' },
      { key: 'home_cta_title',        label: 'CTA Section Title',    type: 'text',     hint: 'e.g. Honor Your Loved One Today' },
      { key: 'home_cta_subtitle',     label: 'CTA Subtitle',         type: 'textarea', hint: 'Text below the CTA heading' },
    ],
  },
  {
    page: 'About Page',
    color: 'purple',
    fields: [
      { key: 'about_hero_title',      label: 'Hero Title',           type: 'text',     hint: 'e.g. About EternaRest' },
      { key: 'about_hero_subtitle',   label: 'Hero Subtitle',        type: 'textarea', hint: 'Tagline under the hero title' },
      { key: 'about_story_title',     label: 'Our Story Title',      type: 'text',     hint: 'e.g. Our Story' },
      { key: 'about_story_body',      label: 'Our Story Text',       type: 'textarea', hint: 'Use new lines to separate paragraphs' },
      { key: 'about_story_image',     label: 'Our Story Image',      type: 'image',    hint: 'Photo beside the story text' },
      { key: 'about_facility_title',  label: 'Facility Section Title',type: 'text',    hint: 'e.g. Our Facility' },
      { key: 'about_facility_body',   label: 'Facility Description', type: 'textarea', hint: 'Use new lines to separate paragraphs' },
      { key: 'about_facility_image',  label: 'Facility Image',       type: 'image',    hint: 'Photo of the columbarium / facility' },
      { key: 'about_value_1_title',   label: 'Value 1 Title',        type: 'text',     hint: 'e.g. Compassion' },
      { key: 'about_value_1_desc',    label: 'Value 1 Description',  type: 'textarea', hint: '' },
      { key: 'about_value_2_title',   label: 'Value 2 Title',        type: 'text',     hint: 'e.g. Dignity' },
      { key: 'about_value_2_desc',    label: 'Value 2 Description',  type: 'textarea', hint: '' },
      { key: 'about_value_3_title',   label: 'Value 3 Title',        type: 'text',     hint: 'e.g. Preservation' },
      { key: 'about_value_3_desc',    label: 'Value 3 Description',  type: 'textarea', hint: '' },
      { key: 'about_value_4_title',   label: 'Value 4 Title',        type: 'text',     hint: 'e.g. Community' },
      { key: 'about_value_4_desc',    label: 'Value 4 Description',  type: 'textarea', hint: '' },
    ],
  },
  {
    page: 'Contact Page',
    color: 'emerald',
    fields: [
      { key: 'contact_hero_title',    label: 'Hero Title',           type: 'text',     hint: 'e.g. Contact Us' },
      { key: 'contact_hero_subtitle', label: 'Hero Subtitle',        type: 'textarea', hint: 'Tagline under the hero title' },
      { key: 'contact_intro',         label: 'Intro Text',           type: 'textarea', hint: 'Text above the contact form' },
      { key: 'contact_map_embed',     label: 'Google Maps Embed URL',type: 'text',     hint: 'Paste the src URL from Google Maps embed code' },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function ImageFieldUpload({ value, onChange, token, hint }: {
  value: string; onChange: (url: string) => void; token: string; hint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const ref = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErr('');
    // Show local preview immediately so admin can see what they selected
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    const r = await uploadCMSImage(file, token);
    setUploading(false);
    URL.revokeObjectURL(objectUrl);
    setLocalPreview('');
    if (r.success && r.url) onChange(r.url);
    else setErr(r.error ?? 'Upload failed');
  };

  const preview = localPreview || value;

  return (
    <div className="space-y-2">
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {/* Preview card */}
      {preview && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-xs font-medium">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={() => { onChange(''); setLocalPreview(''); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="px-3 py-2 bg-[#d4af37]/10 text-[#b8960c] rounded-lg text-xs font-semibold hover:bg-[#d4af37]/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {preview ? 'Replace Image' : 'Upload Image'}
        </button>
        <span className="text-gray-300 text-xs">or</span>
        <input className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#d4af37]/40"
          value={value} placeholder="paste image URL…" onChange={e => { setLocalPreview(''); onChange(e.target.value); }} />
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}

export function AdminPageContent() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (json.success) {
        const map: Record<string, string> = {};
        (json.raw ?? []).forEach((s: any) => { map[s.key] = typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value ?? ''); });
        setDraft(map);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const save = async () => {
    setSaving(true); setSaveStatus(null);
    try {
      const allFields = PAGE_SECTIONS.flatMap(s => s.fields);
      // Only send fields that have a value — never overwrite saved data with empty strings
      const payload = allFields
        .filter(f => (draft[f.key] ?? '').trim() !== '')
        .map(f => ({ key: f.key, value: draft[f.key], group: 'pages', isPublic: true }));
      if (payload.length === 0) { setSaveStatus('saved'); setSaving(false); return; }
      const r = await fetch(`${BASE}/admin/settings/bulk`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      const json = await r.json();
      setSaveStatus(json.success ? 'saved' : 'error');
      if (json.success) load();
    } catch { setSaveStatus('error'); }
    setSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const set = (key: string, val: string) => setDraft(d => ({ ...d, [key]: val }));

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] transition-all placeholder:text-gray-300";

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0d1117]">Page Content Manager</h2>
          <p className="text-sm text-gray-400 mt-0.5">Edit all text and images shown on the public website</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && <span className="text-emerald-600 text-sm font-medium">✓ Saved</span>}
          {saveStatus === 'error' && <span className="text-red-500 text-sm font-medium">Save failed</span>}
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 bg-[#0d1117] text-white rounded-xl text-sm font-semibold hover:bg-[#1a2332] disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PAGE_SECTIONS.map((s, i) => (
          <button key={i} onClick={() => setActiveSection(i)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeSection === i ? 'bg-[#0d1117] text-white border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            {s.page}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {PAGE_SECTIONS[activeSection].fields.map(field => (
            <div key={field.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <label className="block text-sm font-semibold text-[#0d1117]">{field.label}</label>
                  <span className="text-xs font-mono text-gray-400">{field.key}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_MAP[PAGE_SECTIONS[activeSection].color]}`}>
                  {field.type}
                </span>
              </div>
              {field.type === 'image' ? (
                <ImageFieldUpload value={draft[field.key] ?? ''} onChange={v => set(field.key, v)} token={token} hint={field.hint} />
              ) : field.type === 'textarea' ? (
                <textarea className={inputCls} rows={3} value={draft[field.key] ?? ''} placeholder={field.hint}
                  onChange={e => set(field.key, e.target.value)} />
              ) : (
                <input className={inputCls} value={draft[field.key] ?? ''} placeholder={field.hint}
                  onChange={e => set(field.key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
