import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Memorial } from '@/lib/types';
import { uploadMemorialMedia } from '@/hooks/useCMS';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.replace('/api', '');

function resolveUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

type Tab = 'bio' | 'photos' | 'videos' | 'tributes';

export default function MemorialPage() {
  const { id } = useParams<{ id: string }>();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('bio');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Comment / tribute form
  const [commentForm, setCommentForm] = useState({ author_name: '', author_email: '', content: '' });
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Biography edit
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [familyText, setFamilyText] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState('');
  const [bioSuccess, setBioSuccess] = useState(false);

  // Media upload
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (id) loadMemorial(); }, [id]);

  const loadMemorial = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMemorial(id!);
      if (res.success) {
        setMemorial(res.data);
        setBioText(res.data.biography || '');
        setFamilyText(res.data.family_information || '');
      } else setError('Memorial not found');
    } catch (e: any) {
      setError(e.message || 'Failed to load memorial');
    }
    setLoading(false);
  };

  const saveBiography = async () => {
    setSavingBio(true);
    setBioError('');
    try {
      const memId = memorial!.booking_id || memorial!.id;
      const res = await fetch(`${API_BASE}/memorials/${memId}/biography`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biography: bioText, familyInformation: familyText }),
      });
      const json = await res.json();
      if (json.success) {
        setMemorial(prev => prev ? { ...prev, biography: bioText, family_information: familyText } : prev);
        setEditingBio(false);
        setBioSuccess(true);
        setTimeout(() => setBioSuccess(false), 4000);
      } else {
        setBioError(json.message || 'Failed to save');
      }
    } catch (e: any) {
      setBioError(e.message || 'Failed to save');
    }
    setSavingBio(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.author_name.trim() || !commentForm.content.trim()) {
      setCommentError('Name and message are required');
      return;
    }
    setSubmittingComment(true);
    setCommentError('');
    try {
      const res = await api.addComment(
        memorial!.booking_id || memorial!.id,
        commentForm.author_name,
        commentForm.content,
        commentForm.author_email || undefined,
      );
      if (res.success) {
        setCommentSuccess(true);
        setCommentForm({ author_name: '', author_email: '', content: '' });
        setTimeout(() => setCommentSuccess(false), 5000);
      } else {
        setCommentError(res.error || 'Failed to submit');
      }
    } catch (e: any) {
      setCommentError(e.message || 'Failed to submit');
    }
    setSubmittingComment(false);
  };

  const handleMediaUpload = async (file: File, type: 'photo' | 'video') => {
    setUploadingMedia(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const token = localStorage.getItem('eternarest_token') || '';
      const result = await uploadMemorialMedia(file, token);
      if (!result.success || !result.url) {
        setUploadError(result.error || 'Upload failed');
        setUploadingMedia(false);
        return;
      }
      // Save media to memorial via API
      const res = await fetch(`${API_BASE}/memorials/${memorial!.booking_id || memorial!.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url: result.url }),
      });
      const json = await res.json();
      if (json.success) {
        setUploadSuccess(`${type === 'photo' ? 'Photo' : 'Video'} uploaded! It will appear after admin review.`);
        setTimeout(() => setUploadSuccess(''), 5000);
      } else {
        setUploadError(json.message || 'Failed to save media');
      }
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed');
    }
    setUploadingMedia(false);
  };

  const photos = memorial?.media?.filter(m => m.media_type === 'photo') ?? [];
  const videos = memorial?.media?.filter(m => m.media_type === 'video') ?? [];
  const tributes = memorial?.tributes ?? [];
  const profileImg = resolveUrl(memorial?.profile_image);

  if (loading) return (
    <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading memorial...</p>
      </div>
    </div>
  );

  if (error || !memorial) return (
    <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#1a2332] mb-4">Memorial Not Found</h1>
        <p className="text-gray-600 mb-8">{error || 'This memorial does not exist or has not been published yet.'}</p>
        <Link to="/search" className="inline-flex items-center px-6 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">
          Search Memorials
        </Link>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'bio',     label: 'Biography' },
    { id: 'photos',  label: `Photos (${photos.length})` },
    { id: 'videos',  label: `Videos (${videos.length})` },
    { id: 'tributes',label: `Tributes (${tributes.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#1a2332] to-[#2d3a4f] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Profile image */}
          <div className="w-32 h-32 rounded-full mx-auto mb-6 shadow-xl overflow-hidden border-4 border-[#d4af37]/40">
            {profileImg ? (
              <img src={profileImg} alt={memorial.deceased_name} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center">
                <span className="text-5xl font-serif font-bold text-white">{memorial.deceased_name.charAt(0)}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">{memorial.deceased_name}</h1>

          {(memorial.birth_date || memorial.death_date) && (
            <p className="text-xl text-gray-300 mb-4">
              {memorial.birth_date && formatDate(memorial.birth_date)}
              {memorial.birth_date && memorial.death_date && ' — '}
              {memorial.death_date && formatDate(memorial.death_date)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {memorial.views ?? 0} views
            </span>
            <span className="font-mono text-xs bg-white/10 px-3 py-1 rounded-full">{memorial.memorial_id}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-8 gap-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-5 py-3 font-medium text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">

          {/* Biography */}
          {activeTab === 'bio' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#1a2332]">Life Story</h2>
                {!editingBio && (
                  <button onClick={() => { setBioText(memorial.biography || ''); setFamilyText(memorial.family_information || ''); setEditingBio(true); setBioError(''); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#d4af37]/10 text-[#b8960c] rounded-lg text-sm font-semibold hover:bg-[#d4af37]/20 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {memorial.biography ? 'Edit' : 'Add Biography'}
                  </button>
                )}
              </div>

              {bioSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Biography saved successfully.
                </div>
              )}

              {editingBio ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Biography / Life Story</label>
                    <textarea
                      value={bioText}
                      onChange={e => setBioText(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm text-gray-700 leading-relaxed resize-y"
                      placeholder="Write about this person's life — their story, achievements, passions, and the memories they leave behind…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Family Information <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea
                      value={familyText}
                      onChange={e => setFamilyText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm text-gray-700 leading-relaxed resize-y"
                      placeholder="Survived by spouse, children, siblings…"
                    />
                  </div>
                  {bioError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{bioError}</div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveBiography} disabled={savingBio}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all disabled:opacity-50 text-sm">
                      {savingBio ? (
                        <><div className="w-4 h-4 border-2 border-[#1a2332] border-t-transparent rounded-full animate-spin" />Saving…</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Save Biography</>
                      )}
                    </button>
                    <button onClick={() => { setEditingBio(false); setBioError(''); }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {memorial.biography ? (
                    <div className="prose prose-lg max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {memorial.biography}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <p className="text-gray-400 mb-4">No biography has been added yet.</p>
                      <button onClick={() => { setBioText(''); setFamilyText(''); setEditingBio(true); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Biography
                      </button>
                    </div>
                  )}
                  {memorial.family_information && (
                    <div className="mt-8 p-6 bg-[#f8f6f3] rounded-xl">
                      <h3 className="font-semibold text-[#1a2332] mb-3">Family Information</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{memorial.family_information}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Photos */}
          {activeTab === 'photos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#1a2332]">Photo Gallery</h2>
                <div>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f, 'photo'); e.target.value = ''; }} />
                  <button onClick={() => photoRef.current?.click()} disabled={uploadingMedia}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d4af37]/10 text-[#b8960c] rounded-lg text-sm font-semibold hover:bg-[#d4af37]/20 transition-all disabled:opacity-50">
                    {uploadingMedia ? (
                      <><div className="w-4 h-4 border-2 border-[#b8960c] border-t-transparent rounded-full animate-spin" />Uploading…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Photo</>
                    )}
                  </button>
                </div>
              </div>
              {uploadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{uploadError}</div>}
              {uploadSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">{uploadSuccess}</div>}
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <button key={photo.id} onClick={() => setSelectedImage(resolveUrl(photo.url))}
                      className="aspect-square rounded-xl overflow-hidden group">
                      <img src={resolveUrl(photo.url)} alt={photo.caption || 'Memorial photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 italic">No photos yet. Be the first to add one.</p>
                </div>
              )}
            </div>
          )}

          {/* Videos */}
          {activeTab === 'videos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#1a2332]">Video Tributes</h2>
                <div>
                  <input ref={videoRef} type="file" accept="video/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f, 'video'); e.target.value = ''; }} />
                  <button onClick={() => videoRef.current?.click()} disabled={uploadingMedia}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d4af37]/10 text-[#b8960c] rounded-lg text-sm font-semibold hover:bg-[#d4af37]/20 transition-all disabled:opacity-50">
                    {uploadingMedia ? (
                      <><div className="w-4 h-4 border-2 border-[#b8960c] border-t-transparent rounded-full animate-spin" />Uploading…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Add Video</>
                    )}
                  </button>
                </div>
              </div>
              {uploadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{uploadError}</div>}
              {uploadSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">{uploadSuccess}</div>}
              {videos.length > 0 ? (
                <div className="grid gap-6">
                  {videos.map(video => (
                    <div key={video.id} className="rounded-xl overflow-hidden bg-black shadow-lg">
                      <video src={resolveUrl(video.url)} controls className="w-full max-h-[400px]" />
                      {video.caption && <p className="p-4 text-gray-600 bg-white text-sm">{video.caption}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 italic">No videos yet. Be the first to add one.</p>
                </div>
              )}
            </div>
          )}

          {/* Tributes */}
          {activeTab === 'tributes' && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">Condolences & Tributes</h2>

              {/* Leave a message form */}
              <form onSubmit={handleCommentSubmit} className="mb-8 p-6 bg-[#f8f6f3] rounded-xl">
                <h3 className="font-semibold text-[#1a2332] mb-4">Leave a Message</h3>
                {commentSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    Thank you for your message. It will appear after approval.
                  </div>
                )}
                {commentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{commentError}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                    <input type="text" value={commentForm.author_name}
                      onChange={e => setCommentForm(p => ({ ...p, author_name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm"
                      placeholder="Enter your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                    <input type="email" value={commentForm.author_email}
                      onChange={e => setCommentForm(p => ({ ...p, author_email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm"
                      placeholder="your@email.com" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Message *</label>
                  <textarea value={commentForm.content}
                    onChange={e => setCommentForm(p => ({ ...p, content: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm"
                    placeholder="Share your memories or condolences..." />
                </div>
                <button type="submit" disabled={submittingComment}
                  className="px-6 py-2.5 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all disabled:opacity-50 text-sm">
                  {submittingComment ? 'Submitting…' : 'Submit Message'}
                </button>
              </form>

              {/* Tributes list */}
              <div className="space-y-5">
                {tributes.length > 0 ? (
                  [...tributes]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((t, i) => (
                      <div key={i} className="flex items-start gap-4 border-b border-gray-100 pb-5 last:border-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {t.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-[#1a2332] text-sm">{t.author_name}</span>
                            <span className="text-xs text-gray-400">{formatDate(t.created_at)}</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{t.content}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 italic text-center py-8">No messages yet. Be the first to leave a condolence.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Share */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Share this memorial</p>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all text-gray-600 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={selectedImage} alt="Memorial photo"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
