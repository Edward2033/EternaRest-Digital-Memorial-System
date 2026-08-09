import React from 'react';
import { Link } from 'react-router-dom';

// This component serves as a fallback - main routing is in App.tsx
// All pages are routed directly through App.tsx to their respective components

const heroImage = 'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365605739_3e89cbdc.png';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Memorial Garden" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/90 via-[#1a2332]/70 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-6">
              Honoring Lives,<br />
              <span className="text-[#d4af37]">Preserving Memories</span><br />
              Forever
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Create lasting digital memorials for your loved ones with QR-linked burial niches.
            </p>
            <div className="flex gap-4">
              <Link to="/book" className="px-8 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">
                Book a Niche
              </Link>
              <Link to="/search" className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#1a2332] transition-all">
                Search Memorial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-[#1a2332] text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Digital Memorials', desc: 'Create beautiful online tributes with photos, videos, and stories.' },
              { title: 'QR Code Access', desc: 'Each memorial is linked to a unique QR code for instant access.' },
              { title: 'Burial Niche Booking', desc: 'Reserve a dignified resting place in our columbarium walls.' },
            ].map((s, i) => (
              <div key={i} className="bg-[#f8f6f3] rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-[#d4af37] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#1a2332] mb-2">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1a2332]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-6">Honor Your Loved One Today</h2>
          <p className="text-gray-300 mb-8">Create a beautiful and lasting memorial.</p>
          <Link to="/book" className="px-8 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all inline-block">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
