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
  phoneNumber: string; status: string; transactionId?: string; createdAt: string;
}

export function AdminPayments() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  if (!ready) return null;

  const FILTERS = ['all', 'pending', 'verified', 'completed', 'failed'];

  return (
    <AdminLayout onRefresh={load}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0d1117]">Payments</h2>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-[#0d1117] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Booking ID', 'Amount', 'Method', 'Phone', 'Transaction', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{p.bookingId}</td>
                    <td className="px-5 py-4 font-semibold text-[#0d1117]">{p.currency} {p.amount?.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium uppercase">{p.method}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{p.phoneNumber || '—'}</td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-400 max-w-[120px] truncate">{p.transactionId || '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{fmt(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="py-20 text-center text-gray-400 text-sm">No payment records found.</div>
            )}
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
