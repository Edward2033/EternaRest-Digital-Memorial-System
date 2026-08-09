import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/ui/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { uploadCMSImage } from '@/hooks/useCMS';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/admin';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useToken() {
  return localStorage.getItem('eternarest_token') ?? '';
}

async function cmsGet(path: string, token: string) {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}
async function cmsPost(path: string, token: string, body: object) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}
async function cmsPut(path: string, token: string, body: object) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}
async function cmsDel(path: string, token: string) {
  const r = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-[#d4af37]/20" />
      <div className="absolute inset-0 rounded-full border-4 border-[#d4af37] border-t-transparent animate-spin" />
    </div>
  </div>
);

const Badge = ({ on, onLabel = 'Active', offLabel = 'Inactive' }: { on: boolean; onLabel?: string; offLabel?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${on ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'}`}>
    {on ? onLabel : offLabel}
  </span>
);

const Stars = ({ n }: { n: number }) => (
  <span className="text-amber-400 text-sm">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
);

interface ModalProps { title: string; onClose: () => void; onSave: () => void; saving?: boolean; children: React.ReactNode; wide?: boolean; }
const Modal = ({ title, onClose, onSave, saving, children, wide }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] flex flex-col ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-[#0d1117] text-lg">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={onSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d1117] text-white text-sm font-semibold hover:bg-[#1a2332] active:scale-[0.98] transition-all disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  </div>
);

interface ConfirmProps { message: string; onConfirm: () => void; onCancel: () => void; }
const Confirm = ({ message, onConfirm, onCancel }: ConfirmProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
      </div>
      <p className="text-center text-sm text-gray-600">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all">Delete</button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] transition-all placeholder:text-gray-300";

const PageHeader = ({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: () => void; addLabel: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-bold text-[#0d1117]">{title}</h2>
      <p className="text-sm text-gray-400 mt-0.5">{count} {count === 1 ? 'record' : 'records'}</p>
    </div>
    <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1117] text-white text-sm font-semibold hover:bg-[#1a2332] active:scale-[0.98] transition-all shadow-sm self-start sm:self-auto">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      {addLabel}
    </button>
  </div>
);

const TableWrap = ({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty: boolean }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[540px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {headers.map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
      {empty && <div className="py-20 text-center text-gray-400 text-sm">No records yet. Click + to add one.</div>}
    </div>
  </div>
);

const ActionBtns = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center gap-1.5">
    <button onClick={onEdit} className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all" title="Edit">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    </button>
    <button onClick={onDelete} className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all" title="Delete">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
  </div>
);

// ─── Image Upload Component ────────────────────────────────────────────────────

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  token: string;
  label?: string;
}

function ImageUpload({ value, onChange, token, label = 'Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    const result = await uploadCMSImage(file, token);
    setUploading(false);
    if (result.success && result.url) {
      onChange(result.url);
    } else {
      setError(result.error ?? 'Upload failed');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Field label={label}>
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#d4af37]/60 transition-colors cursor-pointer"
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        {value ? (
          <div className="space-y-2">
            <img src={value} alt="Preview" className="h-28 w-full object-cover rounded-lg mx-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <p className="text-xs text-gray-400 truncate max-w-full">{value.split('/').pop()}</p>
            <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Uploading…</p>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-400">Click or drag & drop to upload</p>
                <p className="text-xs text-gray-300">PNG, JPG, GIF, WebP up to 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
      {/* Also allow manual URL entry as fallback */}
      <input className={inputCls + ' mt-2'} value={value} placeholder="Or paste image URL…"
        onChange={e => onChange(e.target.value)} onClick={e => e.stopPropagation()} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </Field>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

function useAdminGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/admin');
  }, [isAuthenticated, isLoading, navigate]);
  return { ready: !isLoading && isAuthenticated };
}
// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

interface Service {
  _id: string; title: string; description: string; features: string[];
  image: string; status: 'active' | 'inactive'; sortOrder: number;
}

const blankService = (): Omit<Service, '_id'> => ({
  title: '', description: '', features: [], image: '', status: 'active', sortOrder: 0,
});

export function AdminServices() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankService());
  const [featuresRaw, setFeaturesRaw] = useState('');
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/services', token);
    if (r.success) setItems(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => { setForm(blankService()); setFeaturesRaw(''); setModal('add'); };
  const openEdit = (s: Service) => {
    setEditId(s._id);
    setForm({ title: s.title, description: s.description, features: s.features ?? [], image: s.image ?? '', status: s.status, sortOrder: s.sortOrder });
    setFeaturesRaw((s.features ?? []).join('\n'));
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    const features = featuresRaw.split('\n').map(f => f.trim()).filter(Boolean);
    const payload = { ...form, features };
    if (modal === 'add') await cmsPost('/services', token, payload);
    else await cmsPut(`/services/${editId}`, token, payload);
    setSaving(false); setModal(null); load();
  };

  const del = async () => { await cmsDel(`/services/${delId}`, token); setDelId(''); load(); };

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? <Spinner /> : (
        <>
          <PageHeader title="Services" count={items.length} onAdd={openAdd} addLabel="Add Service" />
          <TableWrap headers={['Image', 'Title', 'Features', 'Status', 'Order', 'Actions']} empty={items.length === 0}>
            {items.map(s => (
              <tr key={s._id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-4">
                  {s.image
                    ? <img src={s.image} alt="" className="w-12 h-9 object-cover rounded-lg border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-12 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                </td>
                <td className="px-5 py-4 font-semibold text-[#0d1117] max-w-[160px] truncate">{s.title}</td>
                <td className="px-5 py-4 text-gray-400 text-xs">{(s.features ?? []).length} feature{(s.features ?? []).length !== 1 ? 's' : ''}</td>
                <td className="px-5 py-4"><Badge on={s.status === 'active'} /></td>
                <td className="px-5 py-4 text-gray-400 tabular-nums">{s.sortOrder}</td>
                <td className="px-5 py-4"><ActionBtns onEdit={() => openEdit(s)} onDelete={() => setDelId(s._id)} /></td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Service' : 'Edit Service'} onClose={() => setModal(null)} onSave={save} saving={saving} wide>
          <ImageUpload value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} token={token} label="Service Image" />
          <Field label="Title">
            <input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Service title" />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
          </Field>
          <Field label="Features (one per line)">
            <textarea className={inputCls} rows={4} value={featuresRaw} onChange={e => setFeaturesRaw(e.target.value)} placeholder={"Free QR code\nPerpetual care included\nOnline memorial page"} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Sort Order">
              <input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
            </Field>
          </div>
        </Modal>
      )}
      {delId && <Confirm message="Delete this service? This cannot be undone." onConfirm={del} onCancel={() => setDelId('')} />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANNERS
// ═══════════════════════════════════════════════════════════════════════════════

interface Banner {
  _id: string; title: string; text: string; image: string;
  location: string; buttonText: string; buttonLink: string; active: boolean;
}

const BANNER_LOCATIONS = ['home', 'about', 'services', 'memorial', 'booking'];
const blankBanner = (): Omit<Banner, '_id'> => ({ title: '', text: '', image: '', location: 'home', buttonText: '', buttonLink: '', active: true });

export function AdminBanners() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankBanner());
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/banners', token);
    if (r.success) setItems(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => { setForm(blankBanner()); setModal('add'); };
  const openEdit = (b: Banner) => {
    setEditId(b._id);
    setForm({ title: b.title, text: b.text ?? '', image: b.image ?? '', location: b.location, buttonText: b.buttonText ?? '', buttonLink: b.buttonLink ?? '', active: b.active });
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    if (modal === 'add') await cmsPost('/banners', token, form);
    else await cmsPut(`/banners/${editId}`, token, form);
    setSaving(false); setModal(null); load();
  };

  const del = async () => { await cmsDel(`/banners/${delId}`, token); setDelId(''); load(); };

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? <Spinner /> : (
        <>
          <PageHeader title="Banners" count={items.length} onAdd={openAdd} addLabel="Add Banner" />
          <TableWrap headers={['Image', 'Title', 'Location', 'Button', 'Status', 'Actions']} empty={items.length === 0}>
            {items.map(b => (
              <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-4">
                  {b.image
                    ? <img src={b.image} alt="" className="w-14 h-9 object-cover rounded-lg border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-14 h-9 rounded-lg bg-gray-100" />}
                </td>
                <td className="px-5 py-4 font-semibold text-[#0d1117] max-w-[160px] truncate">{b.title}</td>
                <td className="px-5 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium capitalize">{b.location}</span></td>
                <td className="px-5 py-4 text-gray-500 text-sm">{b.buttonText || <span className="text-gray-300 italic">None</span>}</td>
                <td className="px-5 py-4"><Badge on={b.active} /></td>
                <td className="px-5 py-4"><ActionBtns onEdit={() => openEdit(b)} onDelete={() => setDelId(b._id)} /></td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Banner' : 'Edit Banner'} onClose={() => setModal(null)} onSave={save} saving={saving} wide>
          <ImageUpload value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} token={token} label="Banner Image" />
          <Field label="Title">
            <input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Banner title" />
          </Field>
          <Field label="Text">
            <textarea className={inputCls} rows={2} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Banner body text" />
          </Field>
          <Field label="Location">
            <select className={inputCls} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
              {BANNER_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Button Text">
              <input className={inputCls} value={form.buttonText} onChange={e => setForm(p => ({ ...p, buttonText: e.target.value }))} placeholder="e.g. Learn More" />
            </Field>
            <Field label="Button Link">
              <input className={inputCls} value={form.buttonLink} onChange={e => setForm(p => ({ ...p, buttonLink: e.target.value }))} placeholder="/page-url" />
            </Field>
          </div>
          <Field label="Status">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
              <span className="text-sm text-gray-700">Active (visible on website)</span>
            </label>
          </Field>
        </Modal>
      )}
      {delId && <Confirm message="Delete this banner?" onConfirm={del} onCancel={() => setDelId('')} />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SLIDES
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroSlide {
  _id: string; title: string; highlightText: string; description: string;
  image: string; button1Text: string; button1Link: string;
  button2Text: string; button2Link: string; sortOrder: number; active: boolean;
}

const blankSlide = (): Omit<HeroSlide, '_id'> => ({
  title: '', highlightText: '', description: '', image: '',
  button1Text: '', button1Link: '', button2Text: '', button2Link: '', sortOrder: 0, active: true,
});

export function AdminHeroSlides() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankSlide());
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/heroslides', token);
    if (r.success) setItems(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => { setForm(blankSlide()); setModal('add'); };
  const openEdit = (s: HeroSlide) => {
    setEditId(s._id);
    setForm({ title: s.title, highlightText: s.highlightText ?? '', description: s.description ?? '', image: s.image ?? '', button1Text: s.button1Text ?? '', button1Link: s.button1Link ?? '', button2Text: s.button2Text ?? '', button2Link: s.button2Link ?? '', sortOrder: s.sortOrder, active: s.active });
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    if (modal === 'add') await cmsPost('/heroslides', token, form);
    else await cmsPut(`/heroslides/${editId}`, token, form);
    setSaving(false); setModal(null); load();
  };

  const del = async () => { await cmsDel(`/heroslides/${delId}`, token); setDelId(''); load(); };

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? <Spinner /> : (
        <>
          <PageHeader title="Hero Slides" count={items.length} onAdd={openAdd} addLabel="Add Slide" />
          <TableWrap headers={['Image', 'Title', 'Highlight', 'Order', 'Status', 'Actions']} empty={items.length === 0}>
            {items.map(s => (
              <tr key={s._id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-4">
                  {s.image
                    ? <img src={s.image} alt="" className="w-14 h-9 object-cover rounded-lg border border-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-14 h-9 rounded-lg bg-gray-100" />}
                </td>
                <td className="px-5 py-4 font-semibold text-[#0d1117] max-w-[180px] truncate">{s.title}</td>
                <td className="px-5 py-4 text-[#b8960c] text-sm max-w-[140px] truncate">{s.highlightText || <span className="text-gray-300 italic">—</span>}</td>
                <td className="px-5 py-4 text-gray-400 tabular-nums">{s.sortOrder}</td>
                <td className="px-5 py-4"><Badge on={s.active} /></td>
                <td className="px-5 py-4"><ActionBtns onEdit={() => openEdit(s)} onDelete={() => setDelId(s._id)} /></td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Hero Slide' : 'Edit Hero Slide'} onClose={() => setModal(null)} onSave={save} saving={saving} wide>
          <ImageUpload value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} token={token} label="Background Image" />
          <Field label="Title">
            <input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Main heading" />
          </Field>
          <Field label="Highlight Text (golden accent)">
            <input className={inputCls} value={form.highlightText} onChange={e => setForm(p => ({ ...p, highlightText: e.target.value }))} placeholder="Preserving Memories" />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Slide subtitle" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Button 1 Text"><input className={inputCls} value={form.button1Text} onChange={e => setForm(p => ({ ...p, button1Text: e.target.value }))} placeholder="Book Now" /></Field>
            <Field label="Button 1 Link"><input className={inputCls} value={form.button1Link} onChange={e => setForm(p => ({ ...p, button1Link: e.target.value }))} placeholder="/book" /></Field>
            <Field label="Button 2 Text"><input className={inputCls} value={form.button2Text} onChange={e => setForm(p => ({ ...p, button2Text: e.target.value }))} placeholder="Learn More" /></Field>
            <Field label="Button 2 Link"><input className={inputCls} value={form.button2Link} onChange={e => setForm(p => ({ ...p, button2Link: e.target.value }))} placeholder="/about" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order"><input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></Field>
            <Field label="Status">
              <label className="flex items-center gap-2.5 h-[42px] cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </Field>
          </div>
        </Modal>
      )}
      {delId && <Confirm message="Delete this slide?" onConfirm={del} onCancel={() => setDelId('')} />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════════

interface Testimonial {
  _id: string; name: string; photo: string; message: string; rating: number; approved: boolean; sortOrder: number;
}

const blankTestimonial = (): Omit<Testimonial, '_id'> => ({ name: '', photo: '', message: '', rating: 5, approved: false, sortOrder: 0 });

export function AdminTestimonials() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankTestimonial());
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/testimonials', token);
    if (r.success) setItems(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => { setForm(blankTestimonial()); setModal('add'); };
  const openEdit = (t: Testimonial) => {
    setEditId(t._id);
    setForm({ name: t.name, photo: t.photo ?? '', message: t.message, rating: t.rating, approved: t.approved, sortOrder: t.sortOrder });
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    if (modal === 'add') await cmsPost('/testimonials', token, form);
    else await cmsPut(`/testimonials/${editId}`, token, form);
    setSaving(false); setModal(null); load();
  };

  const del = async () => { await cmsDel(`/testimonials/${delId}`, token); setDelId(''); load(); };

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? <Spinner /> : (
        <>
          <PageHeader title="Testimonials" count={items.length} onAdd={openAdd} addLabel="Add Testimonial" />
          <TableWrap headers={['Photo', 'Name', 'Message', 'Rating', 'Status', 'Actions']} empty={items.length === 0}>
            {items.map(t => (
              <tr key={t._id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-4">
                  {t.photo
                    ? <img src={t.photo} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center text-white text-sm font-bold">{t.name.charAt(0)}</div>}
                </td>
                <td className="px-5 py-4 font-semibold text-[#0d1117] whitespace-nowrap">{t.name}</td>
                <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{t.message}</td>
                <td className="px-5 py-4"><Stars n={t.rating} /></td>
                <td className="px-5 py-4"><Badge on={t.approved} onLabel="Approved" offLabel="Pending" /></td>
                <td className="px-5 py-4"><ActionBtns onEdit={() => openEdit(t)} onDelete={() => setDelId(t._id)} /></td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Testimonial' : 'Edit Testimonial'} onClose={() => setModal(null)} onSave={save} saving={saving} wide>
          <ImageUpload value={form.photo} onChange={url => setForm(p => ({ ...p, photo: url }))} token={token} label="Photo (optional)" />
          <Field label="Customer Name">
            <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
          </Field>
          <Field label="Message">
            <textarea className={inputCls} rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Testimonial message" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating (1–5)">
              <input type="number" min={1} max={5} className={inputCls} value={form.rating} onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))} />
            </Field>
            <Field label="Sort Order">
              <input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Status">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.approved} onChange={e => setForm(p => ({ ...p, approved: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
              <span className="text-sm text-gray-700">Approved (visible on site)</span>
            </label>
          </Field>
        </Modal>
      )}
      {delId && <Confirm message="Delete this testimonial?" onConfirm={del} onCancel={() => setDelId('')} />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════════════════════════

interface GalleryItem {
  _id: string; title: string; category: string; images: string[]; active: boolean; sortOrder: number;
}

const GALLERY_CATS = ['Memorial Sites', 'Niches', 'Events', 'Services'];
const blankGallery = (): Omit<GalleryItem, '_id'> => ({ title: '', category: 'Memorial Sites', images: [], active: true, sortOrder: 0 });

export function AdminGallery() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankGallery());
  const [imagesRaw, setImagesRaw] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/gallery', token);
    if (r.success) setItems(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => { setForm(blankGallery()); setImagesRaw(''); setModal('add'); };
  const openEdit = (g: GalleryItem) => {
    setEditId(g._id);
    setForm({ title: g.title, category: g.category, images: g.images ?? [], active: g.active, sortOrder: g.sortOrder });
    setImagesRaw((g.images ?? []).join('\n'));
    setModal('edit');
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    const result = await uploadCMSImage(file, token);
    setUploading(false);
    if (result.success && result.url) {
      setImagesRaw(prev => prev ? prev + '\n' + result.url : (result.url ?? ''));
    }
  };

  const save = async () => {
    setSaving(true);
    const images = imagesRaw.split('\n').map(s => s.trim()).filter(Boolean);
    const payload = { ...form, images };
    if (modal === 'add') await cmsPost('/gallery', token, payload);
    else await cmsPut(`/gallery/${editId}`, token, payload);
    setSaving(false); setModal(null); load();
  };

  const del = async () => { await cmsDel(`/gallery/${delId}`, token); setDelId(''); load(); };

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? <Spinner /> : (
        <>
          <PageHeader title="Gallery" count={items.length} onAdd={openAdd} addLabel="Add Album" />
          {items.length === 0
            ? <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center text-gray-400 text-sm">No gallery albums yet.</div>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(g => (
                  <div key={g._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="h-28 bg-gray-50 flex gap-1 overflow-hidden p-1">
                      {g.images.slice(0, 4).map((img, i) => (
                        <img key={i} src={img} alt="" className="h-full flex-1 object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      ))}
                      {g.images.length === 0 && <div className="flex-1 flex items-center justify-center text-gray-300 text-xs">No images</div>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#0d1117] text-sm">{g.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{g.category} · {g.images.length} image{g.images.length !== 1 ? 's' : ''}</p>
                        </div>
                        <Badge on={g.active} />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => openEdit(g)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs font-semibold transition-all">Edit</button>
                        <button onClick={() => setDelId(g._id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs font-semibold transition-all">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Gallery Album' : 'Edit Gallery Album'} onClose={() => setModal(null)} onSave={save} saving={saving} wide>
          <Field label="Title">
            <input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Album title" />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {GALLERY_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Images">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await handleUploadImage(f); }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="px-3 py-2 bg-[#d4af37]/10 text-[#b8960c] rounded-lg text-xs font-semibold hover:bg-[#d4af37]/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {uploading ? <><div className="w-3 h-3 border border-[#b8960c] border-t-transparent rounded-full animate-spin" /> Uploading…</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Upload Image</>}
                </button>
                <span className="text-xs text-gray-400 self-center">or paste URLs below</span>
              </div>
              <textarea className={inputCls} rows={4} value={imagesRaw} onChange={e => setImagesRaw(e.target.value)} placeholder={"https://…\nhttps://…"} />
              <p className="text-xs text-gray-400">One URL per line. Uploaded images are added automatically.</p>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order">
              <input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2.5 h-[42px] cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </Field>
          </div>
        </Modal>
      )}
      {delId && <Confirm message="Delete this gallery album?" onConfirm={del} onCancel={() => setDelId('')} />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════════

interface FAQ {
  _id: string; question: string; answer: string; category: string; sortOrder: number; active: boolean;
}

const FAQ_CATS = ['general', 'booking', 'memorial', 'payment', 'technical'];
const blankFAQ = (): Omit<FAQ, '_id'> => ({ question: '', answer: '', category: 'general', sortOrder: 0, active: true });

export function AdminFAQs() {
  const { ready } = useAdminGuard();
  const token = useToken();
  const [items, setItems] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankFAQ());
  const [editId, setEditId] = useState('');
  const [delId, setDelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/faqs', token);
    if (r.success) setItems(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openAdd = () => { setForm(blankFAQ()); setModal('add'); };
  const openEdit = (f: FAQ) => {
    setEditId(f._id);
    setForm({ question: f.question, answer: f.answer, category: f.category, sortOrder: f.sortOrder, active: f.active });
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    if (modal === 'add') await cmsPost('/faqs', token, form);
    else await cmsPut(`/faqs/${editId}`, token, form);
    setSaving(false); setModal(null); load();
  };

  const del = async () => { await cmsDel(`/faqs/${delId}`, token); setDelId(''); load(); };

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? <Spinner /> : (
        <>
          <PageHeader title="FAQs" count={items.length} onAdd={openAdd} addLabel="Add FAQ" />
          <TableWrap headers={['Question', 'Category', 'Order', 'Status', 'Actions']} empty={items.length === 0}>
            {items.map(f => (
              <tr key={f._id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-4 font-semibold text-[#0d1117] max-w-xs">
                  <p className="truncate">{f.question}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{f.answer}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium capitalize">{f.category}</span>
                </td>
                <td className="px-5 py-4 text-gray-400 tabular-nums">{f.sortOrder}</td>
                <td className="px-5 py-4"><Badge on={f.active} /></td>
                <td className="px-5 py-4"><ActionBtns onEdit={() => openEdit(f)} onDelete={() => setDelId(f._id)} /></td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Add FAQ' : 'Edit FAQ'} onClose={() => setModal(null)} onSave={save} saving={saving} wide>
          <Field label="Question">
            <input className={inputCls} value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="Frequently asked question" />
          </Field>
          <Field label="Answer">
            <textarea className={inputCls} rows={4} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} placeholder="Detailed answer" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {FAQ_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Sort Order">
              <input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2.5 h-[42px] cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded accent-[#d4af37]" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </Field>
          </div>
        </Modal>
      )}
      {delId && <Confirm message="Delete this FAQ?" onConfirm={del} onCancel={() => setDelId('')} />}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

interface SettingRow {
  _id: string;
  key: string;
  value: any;
  group: string;
  description: string;
  isPublic: boolean;
}

const SETTING_PANELS = [
  {
    id: 'site',
    label: 'Site Information',
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text', group: 'general', isPublic: true },
      { key: 'site_email', label: 'Email', type: 'email', group: 'general', isPublic: true },
      { key: 'site_phone', label: 'Phone Number', type: 'text', group: 'general', isPublic: true },
      { key: 'address', label: 'Address', type: 'text', group: 'general', isPublic: true },
      { key: 'hours_gardens', label: 'Garden Hours', type: 'text', group: 'general', isPublic: true },
      { key: 'hours_office', label: 'Office Hours', type: 'text', group: 'general', isPublic: true },
      { key: 'footer_tagline', label: 'Footer Tagline', type: 'text', group: 'general', isPublic: true },
    ],
  },
  {
    id: 'social',
    label: 'Social Media',
    fields: [
      { key: 'facebook', label: 'Facebook URL', type: 'text', group: 'social', isPublic: true },
      { key: 'instagram', label: 'Instagram URL', type: 'text', group: 'social', isPublic: true },
      { key: 'telegram', label: 'Telegram URL', type: 'text', group: 'social', isPublic: true },
      { key: 'youtube', label: 'YouTube URL', type: 'text', group: 'social', isPublic: true },
      { key: 'whatsapp', label: 'WhatsApp Number (digits only)', type: 'text', group: 'social', isPublic: true },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    fields: [
      { key: 'meta_title', label: 'Meta Title', type: 'text', group: 'seo', isPublic: false },
      { key: 'meta_description', label: 'Meta Description', type: 'textarea', group: 'seo', isPublic: false },
      { key: 'keywords', label: 'Keywords', type: 'text', group: 'seo', isPublic: false },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    fields: [
      { key: 'mtn_momo', label: 'MTN MoMo Number', type: 'text', group: 'payment', isPublic: true },
      { key: 'airtel_money', label: 'Airtel Money Number', type: 'text', group: 'payment', isPublic: true },
      { key: 'bank_name', label: 'Bank Name', type: 'text', group: 'payment', isPublic: true },
      { key: 'bank_account', label: 'Bank Account', type: 'text', group: 'payment', isPublic: true },
      { key: 'account_holder', label: 'Account Holder', type: 'text', group: 'payment', isPublic: true },
    ],
  },
] as const;

const SETTING_GROUPS = [
  'general',
  'email',
  'payment',
  'memorial',
  'notifications',
  'seo',
  'social',
  'appearance',
];

const blankSetting = (): Omit<SettingRow, '_id'> => ({
  key: '',
  value: '',
  group: 'general',
  description: '',
  isPublic: false,
});

export function AdminSettings() {
  const { ready } = useAdminGuard();
  const token = useToken();

  const [items, setItems] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState(blankSetting());
  const [editKey, setEditKey] = useState('');
  const [delKey, setDelKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<'panels' | 'advanced'>('panels');
  const [activeGroup, setActiveGroup] = useState('all');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await cmsGet('/settings', token);

    if (r.success) {
      const rows: SettingRow[] = Array.isArray(r.raw) ? r.raw : [];
      setItems(rows);

      const map: Record<string, string> = Object.fromEntries(
        rows.map(s => [
          s.key,
          typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value),
        ])
      );

      setDraft(map);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const visible = useMemo(() => {
    return activeGroup === 'all'
      ? items
      : items.filter(s => s.group === activeGroup);
  }, [items, activeGroup]);

  const savePanels = async () => {
    setSavingBulk(true);
    setSaveStatus(null);

    try {
      const allFields = SETTING_PANELS.flatMap(p => p.fields);

      const payload = allFields.map(f => ({
        key: f.key,
        value: draft[f.key] ?? '',
        group: f.group,
        isPublic: f.isPublic,
      }));

      const r = await fetch(`${BASE}/settings/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: payload }),
      });

      const json = await r.json();
      setSaveStatus(json.success ? 'saved' : 'error');

      if (json.success) load();
    } catch {
      setSaveStatus('error');
    }

    setSavingBulk(false);

    setTimeout(() => setSaveStatus(null), 3000);
  };

  const openAdd = () => {
    setForm(blankSetting());
    setModal('add');
  };

  const openEdit = (s: SettingRow) => {
    setEditKey(s.key);

    setForm({
      key: s.key,
      value: typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value),
      group: s.group,
      description: s.description ?? '',
      isPublic: s.isPublic,
    });

    setModal('edit');
  };

  const save = async () => {
    setSaving(true);

    if (modal === 'add') {
      await fetch(`${BASE}/settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`${BASE}/settings/${editKey}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: form.value,
          description: form.description,
        }),
      });
    }

    setSaving(false);
    setModal(null);
    load();
  };

  const del = async () => {
    await fetch(`${BASE}/settings/${delKey}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    setDelKey('');
    load();
  };

  const groups = ['all', ...SETTING_GROUPS];

  if (!ready) return null;

  return (
    <AdminLayout onRefresh={load}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100 mb-6 w-fit">
            {(['panels', 'advanced'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === t
                    ? 'bg-[#0d1117] text-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {t === 'panels' ? 'Quick Edit' : 'Advanced'}
              </button>
            ))}
          </div>

          {/* Panels UI */}
          {activeTab === 'panels' && (
            <div className="space-y-6">
              {SETTING_PANELS.map(panel => (
                <div key={panel.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-[#0d1117]">{panel.label}</h3>
                  </div>

                  <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {panel.fields.map(f => (
                      <Field key={f.key} label={f.label}>
                        {f.type === 'textarea' ? (
                          <textarea
                            className={inputCls}
                            rows={3}
                            value={draft[f.key] ?? ''}
                            onChange={e =>
                              setDraft(d => ({ ...d, [f.key]: e.target.value }))
                            }
                          />
                        ) : (
                          <input
                            type={f.type}
                            className={inputCls}
                            value={draft[f.key] ?? ''}
                            onChange={e =>
                              setDraft(d => ({ ...d, [f.key]: e.target.value }))
                            }
                          />
                        )}
                      </Field>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-4">
                <button
                  onClick={savePanels}
                  disabled={savingBulk}
                  className="px-6 py-3 bg-[#0d1117] text-white rounded-xl font-semibold text-sm hover:bg-[#1a2332] disabled:opacity-50"
                >
                  {savingBulk ? 'Saving…' : 'Save All Settings'}
                </button>

                {saveStatus === 'saved' && (
                  <span className="text-emerald-600 text-sm font-medium">
                    Settings saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-500 text-sm font-medium">
                    Save failed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Advanced UI */}
          {activeTab === 'advanced' && (
            <>
              <PageHeader
                title="All Settings"
                count={visible.length}
                onAdd={openAdd}
                addLabel="Add Setting"
              />

              <div className="flex flex-wrap gap-2 mb-5">
                {groups.map(g => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      activeGroup === g
                        ? 'bg-[#0d1117] text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {visible.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 text-sm">
                    No settings in this group.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {visible.map(s => (
                      <div key={s._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-[#0d1117]">
                              {s.key}
                            </span>

                            <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md text-xs capitalize">
                              {s.group}
                            </span>

                            {s.isPublic && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-md text-xs">
                                Public
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-500 mt-0.5 truncate">
                            {typeof s.value === 'object'
                              ? JSON.stringify(s.value)
                              : String(s.value)}
                          </p>

                          {s.description && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {s.description}
                            </p>
                          )}
                        </div>

                        <ActionBtns
                          onEdit={() => openEdit(s)}
                          onDelete={() => setDelKey(s.key)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Setting' : 'Edit Setting'}
          onClose={() => setModal(null)}
          onSave={save}
          saving={saving}
        >
          <Field label="Key">
            <input
              className={inputCls}
              value={form.key}
              readOnly={modal === 'edit'}
              onChange={e =>
                setForm(p => ({ ...p, key: e.target.value }))
              }
            />
          </Field>

          <Field label="Value">
            <input
              className={inputCls}
              value={form.value}
              onChange={e =>
                setForm(p => ({ ...p, value: e.target.value }))
              }
            />
          </Field>

          {modal === 'add' && (
            <Field label="Group">
              <select
                className={inputCls}
                value={form.group}
                onChange={e =>
                  setForm(p => ({ ...p, group: e.target.value }))
                }
              >
                {SETTING_GROUPS.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Description">
            <input
              className={inputCls}
              value={form.description}
              onChange={e =>
                setForm(p => ({ ...p, description: e.target.value }))
              }
            />
          </Field>

          {modal === 'add' && (
            <Field label="Visibility">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={e =>
                    setForm(p => ({ ...p, isPublic: e.target.checked }))
                  }
                />
                <span className="text-sm text-gray-700">
                  Public (visible to site visitors)
                </span>
              </label>
            </Field>
          )}
        </Modal>
      )}

      {delKey && (
        <Confirm
          message={`Delete setting "${delKey}"?`}
          onConfirm={del}
          onCancel={() => setDelKey('')}
        />
      )}
    </AdminLayout>
  );
}