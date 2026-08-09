import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '@/hooks/useCMS';

// ─── Static fallbacks ─────────────────────────────────────────────────────────

const FALLBACK_HERO = {
  title: 'Honoring Lives,', highlightText: 'Preserving Memories',
  description: 'Create lasting digital memorials for your loved ones. Our dignified burial niche services and QR-linked memorial pages ensure their legacy lives on for generations.',
  image: 'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365605739_3e89cbdc.png',
  button1Text: 'Book a Niche', button1Link: '/book',
  button2Text: 'Search Memorial', button2Link: '/search',
};

const FALLBACK_SERVICES = [
  { _id: 'f1', title: 'Digital Memorials',    description: 'Create beautiful online tributes with photos, videos, and stories.', features: [], image: '', sortOrder: 0, status: 'active' as const },
  { _id: 'f2', title: 'QR Code Access',        description: 'Each memorial is linked to a unique QR code placed on the burial niche.', features: [], image: '', sortOrder: 1, status: 'active' as const },
  { _id: 'f3', title: 'Burial Niche Booking',  description: 'Reserve a dignified resting place in our beautiful columbarium walls.', features: [], image: '', sortOrder: 2, status: 'active' as const },
];

const FALLBACK_GALLERY_IMAGES = [
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365625617_9b2015e6.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365624819_1475e90c.png',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365628917_7fb92162.png',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365662163_0bc163fd.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365662574_cf9b6987.png',
];

const FALLBACK_TESTIMONIALS = [
  { _id: 't1', name: 'Maria Santos',    message: 'EternaRest helped us create a beautiful digital memorial. The QR code allows visitors to learn about his incredible life story.', rating: 5, approved: true, sortOrder: 0, photo: '' },
  { _id: 't2', name: 'James Chen',      message: 'The booking process was seamless and respectful. The staff guided us with compassion and professionalism.', rating: 5, approved: true, sortOrder: 1, photo: '' },
  { _id: 't3', name: 'Elena Rodriguez', message: "Being able to add photos to my grandmother's memorial means so much. Her memory lives on beautifully.", rating: 5, approved: true, sortOrder: 2, photo: '' },
];

const SERVICE_ICON = (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < n ? 'text-[#d4af37]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { heroSlides, services, gallery, testimonials, banners, faqs, settings, loading } = useCMS();
  const s = settings;
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    email: '',
    rating: 5,
    message: '',
  });
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [testimonialSuccess, setTestimonialSuccess] = useState(false);
  const [testimonialError, setTestimonialError] = useState('');

  const hero           = heroSlides[0] ?? null;
  const heroTitle      = s.home_hero_title       || hero?.title         || FALLBACK_HERO.title;
  const heroHighlight  = s.home_hero_highlight   || hero?.highlightText || FALLBACK_HERO.highlightText;
  const heroDesc       = s.home_hero_description || hero?.description   || FALLBACK_HERO.description;
  const heroBg         = s.home_hero_image       || hero?.image         || FALLBACK_HERO.image;
  const heroBtn1Text   = s.home_hero_btn1_text   || hero?.button1Text   || FALLBACK_HERO.button1Text;
  const heroBtn1Link   = s.home_hero_btn1_link   || hero?.button1Link   || FALLBACK_HERO.button1Link;
  const heroBtn2Text   = s.home_hero_btn2_text   || hero?.button2Text   || FALLBACK_HERO.button2Text;
  const heroBtn2Link   = s.home_hero_btn2_link   || hero?.button2Link   || FALLBACK_HERO.button2Link;

  const gardenFromSettings = [1,2,3,4,5,6].map(n => s[`home_garden_image_${n}`]).filter(Boolean) as string[];
  const gardenFromGallery  = gallery.flatMap(a => a.images).filter(Boolean).slice(0, 6);
  const galleryImages      = gardenFromSettings.length > 0 ? gardenFromSettings
                           : gardenFromGallery.length > 0  ? gardenFromGallery
                           : FALLBACK_GALLERY_IMAGES;

  const displayServices     = services.length > 0 ? services : FALLBACK_SERVICES;
  const displayTestimonials  = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;
  const homeBanners          = banners.filter(b => b.active && (b.location === 'home' || !b.location));
  const displayFaqs          = faqs.length > 0 ? faqs : [];

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name.trim() || !testimonialForm.message.trim()) {
      setTestimonialError('Name and message are required');
      return;
    }
    setSubmittingTestimonial(true);
    setTestimonialError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/public/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonialForm),
      });
      const data = await res.json();
      if (data.success) {
        setTestimonialSuccess(true);
        setTestimonialForm({ name: '', email: '', rating: 5, message: '' });
        setTimeout(() => setTestimonialSuccess(false), 5000);
      } else {
        setTestimonialError(data.message || 'Failed to submit testimonial');
      }
    } catch (err) {
      setTestimonialError('Network error. Please try again.');
    }
    setSubmittingTestimonial(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3]">

      {/* ── Banner (animated, above fold) ───────────────────────────────────── */}
      {homeBanners.length > 0 && (
        <div className="relative overflow-hidden">
          <style>{`
            @keyframes banner-float {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-3px); }
            }
            @keyframes banner-pulse-ring {
              0%   { box-shadow: 0 0 0 0 rgba(212,175,55,0.35); }
              70%  { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
              100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
            }
            @keyframes banner-shimmer {
              0%   { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            .banner-float    { animation: banner-float 3s ease-in-out infinite; }
            .banner-pulse    { animation: banner-pulse-ring 2s ease-out infinite; }
            .banner-shimmer  {
              background: linear-gradient(90deg, #d4af37 25%, #f5d98b 50%, #d4af37 75%);
              background-size: 200% auto;
              animation: banner-shimmer 3s linear infinite;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          `}</style>

          {homeBanners.map((b, idx) => (
            <div key={b._id}
              className="banner-float bg-gradient-to-r from-[#0d1117] via-[#1a2332] to-[#0d1117] border-b border-[#d4af37]/20"
              style={{ animationDelay: `${idx * 0.5}s` }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Pulse dot */}
                    <span className="banner-pulse relative flex-shrink-0 w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                    {b.image && (
                      <img src={b.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-[#d4af37]/30"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className="min-w-0">
                      <span className="banner-shimmer font-bold text-sm">{b.title}</span>
                      {b.text && <span className="text-gray-400 text-xs ml-2 hidden sm:inline">{b.text}</span>}
                    </div>
                  </div>
                  {b.buttonText && b.buttonLink && (
                    <Link to={b.buttonLink}
                      className="flex-shrink-0 px-4 py-1.5 bg-[#d4af37] text-[#1a2332] text-xs font-bold rounded-lg hover:bg-[#b8960c] transition-all whitespace-nowrap shadow-sm hover:shadow-[#d4af37]/40 hover:shadow-md">
                      {b.buttonText} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Memorial Garden" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/90 via-[#1a2332]/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
              {heroTitle}<br />
              <span className="text-[#d4af37]">{heroHighlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">{heroDesc}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={heroBtn1Link ?? '/book'}
                className="inline-flex items-center justify-center px-8 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {heroBtn1Text}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link to={heroBtn2Link ?? '/search'}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#1a2332] transition-all duration-300">
                {heroBtn2Text}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">{s.home_services_title || 'Our Services'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{s.home_services_subtitle || 'We provide comprehensive memorial services to honor and preserve the memory of your loved ones.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayServices.map((svc) => (
              <div key={svc._id} className="bg-[#f8f6f3] rounded-xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-xl flex items-center justify-center text-white mb-6 overflow-hidden">
                  {svc.image ? <img src={svc.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).replaceWith(document.createElementNS('http://www.w3.org/2000/svg','svg')); }} /> : SERVICE_ICON}
                </div>
                <h3 className="text-xl font-semibold text-[#1a2332] mb-3">{svc.title}</h3>
                <p className="text-gray-600 leading-relaxed">{svc.description}</p>
                {svc.features && svc.features.length > 0 && (
                  <ul className="mt-4 space-y-1">
                    {svc.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section className="py-20 bg-[#f8f6f3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">{s.home_garden_title || 'Our Memorial Gardens'}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{s.home_garden_subtitle || 'A serene and beautiful final resting place designed with care.'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <div key={i} className={`relative overflow-hidden rounded-xl shadow-lg group ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <img src={img} alt={`Memorial ${i + 1}`}
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${i === 0 ? 'h-[400px] md:h-full' : 'h-[250px]'}`}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Creating a lasting memorial is simple with our guided process.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Book a Niche',     desc: 'Select your preferred wall, row, and slot.' },
              { step: '02', title: 'Receive QR Code',  desc: 'A unique QR code is generated and linked.' },
              { step: '03', title: 'Create Memorial',  desc: 'Add photos, videos, biography, and memories.' },
              { step: '04', title: 'Share & Remember', desc: 'Visitors scan to view and leave condolences.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">{s.home_testimonials_title || 'What Families Say'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Hear from families who trusted us to honor their loved ones.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayTestimonials.map((t) => (
              <div key={t._id} className="bg-[#f8f6f3] rounded-xl p-8 relative">
                <svg className="w-12 h-12 text-[#d4af37]/30 absolute top-6 right-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <Stars n={t.rating} />
                <p className="text-gray-600 mb-6 italic leading-relaxed">"{t.message}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                    {t.photo ? <img src={t.photo} alt={t.name} className="w-full h-full object-cover" /> : t.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-[#1a2332]">{t.name}</p>
                    <Stars n={t.rating} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Public Testimonial Submission Form */}
          <div className="mt-16 max-w-2xl mx-auto bg-[#f8f6f3] rounded-2xl p-8 border-2 border-[#d4af37]/20">
            <h3 className="text-2xl font-serif font-bold text-[#1a2332] mb-4 text-center">Share Your Experience</h3>
            <p className="text-gray-600 text-center mb-6">Your feedback helps us serve families better.</p>
            
            {testimonialSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✓ Thank you! Your testimonial will be reviewed and published shortly.
              </div>
            )}
            
            {testimonialError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {testimonialError}
              </div>
            )}

            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={testimonialForm.email}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTestimonialForm({ ...testimonialForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= testimonialForm.rating ? 'text-[#d4af37]' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
                <textarea
                  required
                  value={testimonialForm.message}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  placeholder="Share your experience with EternaRest..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingTestimonial}
                className="w-full px-6 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingTestimonial ? 'Submitting...' : 'Submit Testimonial'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── FAQ (from CMS) ───────────────────────────────────────────────────── */}
      {displayFaqs.length > 0 && (
        <section className="py-20 bg-[#f8f6f3]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to know about our memorial services.</p>
            </div>
            <div className="space-y-3">
              {displayFaqs.map((faq) => (
                <div key={faq._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq._id ? null : faq._id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <h3 className="font-semibold text-[#1a2332] pr-4">{faq.question}</h3>
                    <svg className={`w-5 h-5 text-[#d4af37] flex-shrink-0 transition-transform duration-200 ${openFaq === faq._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === faq._id && (
                    <div className="px-6 pb-5 border-t border-gray-50">
                      <p className="text-gray-600 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[#1a2332] to-[#2d3a4f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">{s.home_cta_title || 'Honor Your Loved One Today'}</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            {s.home_cta_subtitle || 'Create a lasting digital memorial that preserves their memory for generations.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="inline-flex items-center justify-center px-8 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all shadow-lg">
              Book a Burial Niche
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#1a2332] transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
