import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Memorial } from '@/lib/types';

const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');

function resolveUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function MemorialCard({ memorial }: { memorial: Memorial }) {
  const profileImg = resolveUrl(memorial.profile_image);
  return (
    <Link to={`/memorial/${memorial.memorial_id}`}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col sm:flex-row gap-5 group">
      {/* Avatar */}
      <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center shadow-md">
        {profileImg ? (
          <img src={profileImg} alt={memorial.deceased_name} className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span className="text-3xl font-serif font-bold text-white">{memorial.deceased_name.charAt(0)}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-serif font-semibold text-[#1a2332] group-hover:text-[#d4af37] transition-colors truncate">
          {memorial.deceased_name}
        </h3>

        <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-500">
          {memorial.birth_date && memorial.death_date && (
            <span>{formatDate(memorial.birth_date)} — {formatDate(memorial.death_date)}</span>
          )}
          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{memorial.memorial_id}</span>
        </div>

        {memorial.biography && (
          <p className="mt-2 text-gray-500 text-sm line-clamp-2 leading-relaxed">{memorial.biography}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {memorial.media?.length ?? 0} photos/videos
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {memorial.tributes?.length ?? 0} tributes
          </span>
        </div>

        <div className="mt-3 flex items-center text-[#d4af37] font-medium text-sm">
          View Memorial
          <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Memorial[]>([]);
  const [recent, setRecent] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [searched, setSearched] = useState(false);

  // Load recent memorials on mount
  useEffect(() => {
    api.getMemorials().then(res => {
      if (res.success) setRecent(res.data.slice(0, 6));
      setLoadingRecent(false);
    }).catch(() => setLoadingRecent(false));
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchMemorials(query.trim());
      if (res.success) setResults(res.data);
      else setResults([]);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setQuery('');
    setSearched(false);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Hero */}
      <section className="bg-[#1a2332] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Search Memorials</h1>
          <p className="text-gray-400 mb-8">Find a memorial by name, memorial ID, or booking reference.</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or memorial ID…"
                className="w-full pl-12 pr-10 py-4 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
              {query && (
                <button type="button" onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" disabled={loading || !query.trim()}
              className="px-6 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-xl hover:bg-[#b8960c] transition-all disabled:opacity-50 whitespace-nowrap">
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* QR hint */}
          <p className="mt-4 text-gray-500 text-sm">
            <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Have a QR code? Scan it with your phone camera to go directly to the memorial.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search results */}
        {searched && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1a2332]">
                {loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
              </h2>
              <button onClick={handleClear} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Clear search
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-gray-500 text-sm">Searching memorials…</p>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-[#1a2332] mb-2">No Memorials Found</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  No memorials match "{query}". Try a different name or check the spelling.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {results.map(m => <MemorialCard key={m.id} memorial={m} />)}
              </div>
            )}
          </div>
        )}

        {/* Recent memorials */}
        {!searched && (
          <div>
            <h2 className="text-xl font-serif font-semibold text-[#1a2332] mb-5">Recent Memorials</h2>
            {loadingRecent ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recent.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <p className="text-gray-400 text-sm">No published memorials yet.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {recent.map(m => <MemorialCard key={m.id} memorial={m} />)}
              </div>
            )}

            {/* How to find */}
            <div className="mt-10 bg-white rounded-2xl shadow p-8">
              <h3 className="text-lg font-serif font-semibold text-[#1a2332] mb-6">How to Find a Memorial</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', title: 'By Name', desc: 'Enter the full or partial name of the deceased.' },
                  { icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14', title: 'By Memorial ID', desc: 'Use the unique ID (e.g. MEM-XXXXXXXX) from the booking confirmation.' },
                  { icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z', title: 'By QR Code', desc: 'Scan the QR code on the burial niche to go directly to the memorial.' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-4">
                    <div className="w-14 h-14 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#1a2332] mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
