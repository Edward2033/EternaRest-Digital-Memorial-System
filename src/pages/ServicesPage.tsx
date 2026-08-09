import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '@/hooks/useCMS';

const FALLBACK_IMAGES = [
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365625617_9b2015e6.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365624819_1475e90c.png',
  'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365628917_7fb92162.png',
];

const FALLBACK_SERVICES = [
  { _id: 's1', title: 'Burial Niche Booking', description: 'Reserve a dignified resting place in our columbarium walls with a simple online process.', features: ['Multiple wall locations available', 'Various niche sizes', 'Perpetual care included', 'Easy online booking'], image: FALLBACK_IMAGES[0], sortOrder: 0, status: 'active' as const },
  { _id: 's2', title: 'Digital Memorial Pages', description: 'Create a rich online tribute with photos, videos, and a full biography for your loved one.', features: ['Unlimited photo uploads', 'Video tribute support', 'Full biography section', 'Condolence messaging'], image: FALLBACK_IMAGES[1], sortOrder: 1, status: 'active' as const },
  { _id: 's3', title: 'QR Code Memorial System', description: 'Each niche includes a unique QR code that links visitors directly to the digital memorial.', features: ['Instant access via smartphone', 'Durable QR code plaques', 'Automatic linking', 'Easy sharing worldwide'], image: FALLBACK_IMAGES[2], sortOrder: 2, status: 'active' as const },
];

const FALLBACK_PACKAGES = [
  { _id: 'p1', name: 'Essential', price: 2500, currency: 'RWF', popular: false, description: 'A simple, dignified option for families.', features: ['Standard niche location', 'Basic memorial page', 'Up to 10 photos', 'QR code plaque', 'Perpetual care'], isActive: true },
  { _id: 'p2', name: 'Premium',   price: 4500, currency: 'RWF', popular: true,  description: 'Our most popular package with enhanced features.', features: ['Premium niche location', 'Full memorial page', 'Unlimited photos', 'Video tributes', 'QR code plaque', 'Perpetual care', 'Priority support'], isActive: true },
  { _id: 'p3', name: 'Legacy',    price: 7500, currency: 'RWF', popular: false, description: 'The ultimate memorial experience.', features: ['Prime niche location', 'Enhanced memorial page', 'Unlimited photos & videos', 'Custom QR code design', 'Perpetual care', 'Dedicated family liaison', 'Annual memorial service'], isActive: true },
];

const FALLBACK_FAQS = [
  { _id: 'f1', question: 'How do I book a burial niche?', answer: 'Book online through our booking page. Fill out the form, select your preferred location, and submit. Our team confirms within 24–48 hours.' },
  { _id: 'f2', question: "Can I update the memorial page after it's created?", answer: 'Yes — contact our admin team to request changes to photos, videos, biography, and other content at any time.' },
  { _id: 'f3', question: 'How does the QR code system work?', answer: 'Each niche gets a unique QR code linking to the digital memorial. Visitors scan it with their phone to instantly access the memorial page.' },
  { _id: 'f4', question: 'Is the memorial page permanent?', answer: 'Yes. All memorial pages are maintained indefinitely as part of our perpetual care commitment.' },
  { _id: 'f5', question: 'Can family from different locations leave condolences?', answer: 'Absolutely. The digital memorial is accessible worldwide — anyone with the link or QR code can visit and leave a message.' },
  { _id: 'f6', question: 'What payment methods are accepted?', answer: 'We accept MTN Mobile Money and Airtel Money. Payment is processed securely via USSD push notification to your phone.' },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AccordionItem({ question, answer, isOpen, onToggle }: {
  question: string; answer: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 group"
        aria-expanded={isOpen}
      >
        <span className={`font-semibold text-base transition-colors duration-200 ${isOpen ? 'text-[#d4af37]' : 'text-[#1a2332] group-hover:text-[#d4af37]'}`}>
          {question}
        </span>
        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-[#d4af37] rotate-180' : 'bg-gray-100 group-hover:bg-[#d4af37]/20'}`}>
          <svg className={`w-4 h-4 transition-colors duration-200 ${isOpen ? 'text-[#1a2332]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-5 border-t border-gray-100">
          <p className="text-gray-600 leading-relaxed pt-4">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { services, faqs, packages, loading } = useCMS(['services', 'faqs', 'packages']);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const displayServices = services.length > 0 ? services : FALLBACK_SERVICES;
  const displayFaqs     = faqs.length > 0 ? faqs : FALLBACK_FAQS;
  const displayPackages = packages.length > 0
    ? packages.filter(p => p.isActive)
    : FALLBACK_PACKAGES;

  const formatPrice = (price: number, currency = 'RWF') =>
    `${currency} ${price.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#f8f6f3]">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 bg-[#1a2332] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#d4af37] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-[#d4af37]/20 text-[#d4af37] text-sm font-semibold rounded-full mb-6 tracking-wide uppercase">
            What We Offer
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
            Our Services &<br />
            <span className="text-[#d4af37]">Memorial Packages</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Comprehensive memorial services designed to honor your loved ones with dignity, compassion, and lasting care.
          </p>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">What We Provide</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Every service is crafted with care to give families peace of mind.</p>
          </div>

          {loading && services.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-24">
              {displayServices.map((svc, idx) => (
                <div key={svc._id} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  {/* Text */}
                  <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#d4af37]/10 rounded-xl mb-6">
                      <span className="text-[#d4af37] font-bold text-lg font-mono">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#1a2332] mb-4">{svc.title}</h3>
                    <p className="text-gray-500 leading-relaxed mb-8 text-lg">{svc.description}</p>
                    {svc.features && svc.features.length > 0 && (
                      <ul className="space-y-3">
                        {svc.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckIcon />
                            <span className="text-gray-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link to="/book"
                      className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#1a2332] text-white font-semibold rounded-xl hover:bg-[#2d3a4f] transition-all duration-200 shadow-sm hover:shadow-md">
                      Book Now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                  {/* Image */}
                  <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-3xl" />
                      {svc.image ? (
                        <img src={svc.image} alt={svc.title}
                          className="relative rounded-2xl shadow-2xl w-full object-cover h-72 lg:h-96"
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES[idx % 3]; }} />
                      ) : (
                        <div className="relative rounded-2xl bg-gradient-to-br from-[#1a2332] to-[#2d3a4f] h-72 lg:h-96 flex items-center justify-center shadow-2xl">
                          <span className="text-[#d4af37]/30 text-9xl font-serif font-bold select-none">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#d4af37]/10 text-[#b8960c] text-sm font-semibold rounded-full mb-4 tracking-wide uppercase">
              Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">Memorial Packages</h2>
            <p className="text-gray-500 max-w-xl mx-auto">All packages include perpetual care and lifetime digital memorial access.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {displayPackages.map((pkg, i) => {
              const isPopular = pkg.popular ?? i === 1;
              return (
                <div key={pkg._id}
                  className={`relative flex flex-col rounded-2xl p-8 transition-all duration-200 ${
                    isPopular
                      ? 'bg-[#1a2332] text-white shadow-2xl ring-2 ring-[#d4af37] scale-105'
                      : 'bg-[#f8f6f3] hover:shadow-xl hover:-translate-y-1'
                  }`}>
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-[#d4af37] text-[#1a2332] text-xs font-bold rounded-full shadow-lg uppercase tracking-wide">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-2xl font-serif font-bold mb-2 ${isPopular ? 'text-white' : 'text-[#1a2332]'}`}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-bold text-[#d4af37]">
                        {formatPrice(pkg.price, pkg.currency)}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className={`text-sm leading-relaxed ${isPopular ? 'text-gray-300' : 'text-gray-500'}`}>
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {(pkg.features ?? []).map((f, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/book"
                    className={`block text-center py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                      isPopular
                        ? 'bg-[#d4af37] text-[#1a2332] hover:bg-[#b8960c] shadow-lg'
                        : 'bg-[#1a2332] text-white hover:bg-[#2d3a4f]'
                    }`}>
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From booking to a live memorial in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Book a Niche',     desc: 'Choose your preferred wall, row, and slot online.' },
              { step: '02', title: 'Make Payment',     desc: 'Pay securely via MTN MoMo or Airtel Money.' },
              { step: '03', title: 'Receive QR Code',  desc: 'A unique QR code is generated and emailed to you.' },
              { step: '04', title: 'Share & Remember', desc: 'Visitors scan to view the memorial and leave tributes.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-[#d4af37]/20" />
                )}
                <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <span className="text-xl font-bold text-white font-mono">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#f8f6f3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-[#d4af37]/10 text-[#b8960c] text-sm font-semibold rounded-full mb-4 tracking-wide uppercase">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500">Click any question to read the answer.</p>
          </div>

          <div className="space-y-3">
            {displayFaqs.map((faq) => (
              <AccordionItem
                key={faq._id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === faq._id}
                onToggle={() => setOpenFaq(openFaq === faq._id ? null : faq._id)}
              />
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-10">
            Still have questions?{' '}
            <Link to="/contact" className="text-[#d4af37] hover:text-[#b8960c] font-semibold transition-colors">
              Contact our team →
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-[#1a2332] via-[#1a2332] to-[#2d3a4f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Ready to Honor Your Loved One?
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Create a lasting digital memorial that preserves their memory for generations to come.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#d4af37] text-[#1a2332] font-bold rounded-xl hover:bg-[#b8960c] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Book a Burial Niche
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
