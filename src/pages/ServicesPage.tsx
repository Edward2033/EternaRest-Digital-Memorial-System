import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '@/hooks/useCMS';

const BASE_URL = 'http://localhost:5000/api/public';

const FALLBACK_IMAGES = [
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365625617_9b2015e6.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365624819_1475e90c.png',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365628917_7fb92162.png',
];

const FALLBACK_SERVICES = [
  { _id: 's1', title: 'Burial Niche Booking',       description: 'Reserve a dignified resting place in our columbarium walls.', features: ['Multiple wall locations available', 'Various niche sizes', 'Perpetual care included', 'Easy online booking'], image: FALLBACK_IMAGES[0], sortOrder: 0, status: 'active' as const },
  { _id: 's2', title: 'Digital Memorial Pages',      description: 'Create a rich online tribute with photos, videos, and biography.', features: ['Unlimited photo uploads', 'Video tribute support', 'Full biography section', 'Condolence messaging'], image: FALLBACK_IMAGES[1], sortOrder: 1, status: 'active' as const },
  { _id: 's3', title: 'QR Code Memorial System',     description: 'Each niche includes a unique QR code linking to the digital memorial.', features: ['Instant access via smartphone', 'Durable QR code plaques', 'Automatic linking', 'Easy sharing'], image: FALLBACK_IMAGES[2], sortOrder: 2, status: 'active' as const },
];

const FALLBACK_PACKAGES = [
  { _id: 'f1', name: 'Essential', price: 2500, currency: 'RWF', popular: false, description: 'Basic memorial package for families seeking a simple, dignified option.', features: ['Standard niche location', 'Basic memorial page', 'Up to 10 photos', 'QR code plaque', 'Perpetual care'], isActive: true },
  { _id: 'f2', name: 'Premium',   price: 4500, currency: 'RWF', popular: true,  description: 'Our most popular package with enhanced features and prime locations.', features: ['Premium niche location', 'Full memorial page', 'Unlimited photos', 'Video tributes', 'QR code plaque', 'Perpetual care', 'Priority support'], isActive: true },
  { _id: 'f3', name: 'Legacy',    price: 7500, currency: 'RWF', popular: false, description: 'The ultimate memorial experience with exclusive features.', features: ['Prime niche location', 'Enhanced memorial page', 'Unlimited photos & videos', 'Custom QR code design', 'Perpetual care', 'Dedicated family liaison', 'Annual memorial service'], isActive: true },
];

interface LivePackage {
  _id: string;
  name: string;
  price: number;
  currency?: string;
  description?: string;
  features?: string[];
  isActive: boolean;
  popular?: boolean;
}

const STATIC_FAQS = [
  { question: 'How do I book a burial niche?',              answer: 'Book online through our booking page. Fill out the form, select your preferred location, and submit. Our team confirms within 24-48 hours.' },
  { question: "Can I update the memorial page after it's created?", answer: 'Yes — contact our admin team to request changes to photos, videos, biography, and other content at any time.' },
  { question: 'How does the QR code system work?',          answer: 'Each niche gets a unique QR code linking to the digital memorial. Visitors scan it with their phone to instantly access the memorial.' },
  { question: 'Is the memorial page permanent?',            answer: 'Yes. All memorial pages are maintained indefinitely as part of our perpetual care commitment.' },
  { question: 'Can family from different locations leave condolences?', answer: 'Absolutely. The digital memorial is accessible worldwide.' },
];

export default function ServicesPage() {
  const { services, loading } = useCMS(['services']);
  const displayServices = services.length > 0 ? services : FALLBACK_SERVICES;

  const [packages, setPackages] = useState<LivePackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPackages() {
      setPkgLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/packages`);
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.packages) && json.packages.length > 0) {
          setPackages(json.packages);
        }
      } catch { /* silent — fallback used below */ }
      if (!cancelled) setPkgLoading(false);
    }
    loadPackages();
    return () => { cancelled = true; };
  }, []);

  const displayPackages: LivePackage[] = packages.length > 0 ? packages : FALLBACK_PACKAGES;

  const formatPrice = (pkg: LivePackage) => {
    const currency = pkg.currency || 'RWF';
    return `${currency} ${(pkg.price ?? 0).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3]">

      {/* Hero */}
      <section className="relative py-20 bg-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Our Services</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive memorial services designed to honor your loved ones with dignity.
          </p>
        </div>
      </section>

      {/* Services list */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && services.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-20">
              {displayServices.map((svc, idx) => (
                <div key={svc._id} className={`grid lg:grid-cols-2 gap-12 items-center`}>
                  <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                    <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-4">{svc.title}</h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">{svc.description}</p>
                    {svc.features.length > 0 && (
                      <ul className="space-y-3">
                        {svc.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                    {svc.image ? (
                      <img src={svc.image} alt={svc.title} className="rounded-2xl shadow-xl w-full object-cover h-72 lg:h-80"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES[idx % 3]; }} />
                    ) : (
                      <div className="rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#b8960c]/10 h-72 lg:h-80 flex items-center justify-center">
                        <span className="text-[#d4af37] text-5xl font-serif">{(idx + 1).toString().padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-4">Memorial Packages</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">All packages include perpetual care and digital memorial access.</p>
          </div>
          {pkgLoading && packages.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {displayPackages.map((pkg, i) => {
                const isPopular = pkg.popular ?? i === 1;
                return (
                  <div key={pkg._id} className={`rounded-2xl p-8 ${isPopular ? 'bg-[#1a2332] text-white ring-4 ring-[#d4af37] transform scale-105' : 'bg-[#f8f6f3]'}`}>
                    {isPopular && <span className="inline-block px-3 py-1 bg-[#d4af37] text-[#1a2332] text-sm font-semibold rounded-full mb-4">Most Popular</span>}
                    <h3 className={`text-2xl font-serif font-bold mb-2 ${isPopular ? 'text-white' : 'text-[#1a2332]'}`}>{pkg.name}</h3>
                    <div className="mb-4"><span className="text-4xl font-bold text-[#d4af37]">{formatPrice(pkg)}</span></div>
                    <p className={`mb-6 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>{pkg.description || ''}</p>
                    <ul className="space-y-3 mb-8">
                      {(pkg.features ?? []).map((f, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={isPopular ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/book" className={`block text-center py-3 rounded-lg font-semibold transition-all ${isPopular ? 'bg-[#d4af37] text-[#1a2332] hover:bg-[#b8960c]' : 'bg-[#1a2332] text-white hover:bg-[#2d3a4f]'}`}>
                      Select Package
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {STATIC_FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#1a2332] mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#1a2332] to-[#2d3a4f]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-6">Ready to Get Started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book"    className="px-8 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">Book Now</Link>
            <Link to="/contact" className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#1a2332] transition-all">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
