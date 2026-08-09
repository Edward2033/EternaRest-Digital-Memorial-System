import React from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '@/hooks/useCMS';

const FALLBACK = {
  heroTitle:    'About EternaRest',
  heroSubtitle: 'Dedicated to honoring lives and preserving memories through dignified memorial services and innovative digital tributes.',
  storyTitle:   'Our Story',
  storyBody:    'EternaRest was founded with a simple yet profound mission: to help families honor their loved ones in a meaningful and lasting way. We understand that losing someone dear is one of life\'s most challenging experiences.\n\nOur journey began when our founder experienced the loss of a loved one and realized the need for a more modern approach to memorialization — a place where physical resting places could be seamlessly connected to rich digital tributes.\n\nToday, EternaRest combines beautiful columbarium facilities with cutting-edge QR technology, allowing visitors to instantly access detailed memorial pages filled with photos, videos, and heartfelt messages.',
  storyImage:   'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365662163_0bc163fd.jpg',
  facilityTitle: 'Our Facility',
  facilityBody:  'Our memorial gardens feature beautifully designed columbarium walls set within serene, landscaped grounds. Each niche is crafted with care, providing a dignified final resting place for your loved ones.\n\nThe facility includes multiple walls with various niche sizes and locations to accommodate different preferences and budgets. Our grounds are meticulously maintained and open to visitors year-round.\n\nEach niche comes with a QR code plaque that visitors can scan to instantly access the digital memorial page, creating a bridge between the physical and digital remembrance.',
  facilityImage: 'https://d64gsuwffb70l.cloudfront.net/6957db5dddd346e060a6fa3f_1767365625617_9b2015e6.jpg',
};

const VALUES = [
  { title: 'Compassion',   description: 'We approach every family with empathy and understanding during their time of loss.' },
  { title: 'Dignity',      description: 'Every memorial is treated with the utmost respect and reverence it deserves.' },
  { title: 'Preservation', description: 'We ensure memories are preserved forever through our digital memorial platform.' },
  { title: 'Community',    description: 'We bring families together through shared memories and condolences.' },
];

const VALUE_ICONS = [
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
];

export default function AboutPage() {
  const { settings } = useCMS(['settings']);

  // Pull CMS values with fallbacks
  const heroTitle     = settings['about_hero_title']     || FALLBACK.heroTitle;
  const heroSubtitle  = settings['about_hero_subtitle']  || FALLBACK.heroSubtitle;
  const storyTitle    = settings['about_story_title']    || FALLBACK.storyTitle;
  const storyBody     = settings['about_story_body']     || FALLBACK.storyBody;
  const storyImage    = settings['about_story_image']    || FALLBACK.storyImage;
  const facilityTitle = settings['about_facility_title'] || FALLBACK.facilityTitle;
  const facilityBody  = settings['about_facility_body']  || FALLBACK.facilityBody;
  const facilityImage = settings['about_facility_image'] || FALLBACK.facilityImage;

  // Parse multi-line values
  const storyParagraphs    = storyBody.split('\n').filter(Boolean);
  const facilityParagraphs = facilityBody.split('\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f8f6f3]">

      {/* Hero */}
      <section className="relative py-20 bg-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">{heroTitle}</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">{heroSubtitle}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-6">{storyTitle}</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                {storyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
            <div className="relative">
              <img src={storyImage} alt="Memorial Garden" className="rounded-2xl shadow-xl w-full"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#d4af37]/20 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">These core principles guide everything we do at EternaRest.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((value, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:bg-[#f8f6f3] transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {VALUE_ICONS[index]}
                </div>
                <h3 className="text-xl font-semibold text-[#1a2332] mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facility */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img src={facilityImage} alt="Columbarium Wall" className="rounded-2xl shadow-xl w-full"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-6">{facilityTitle}</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                {facilityParagraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <Link to="/services" className="inline-flex items-center mt-6 text-[#d4af37] font-semibold hover:text-[#b8960c] transition-colors">
                Learn more about our services
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#1a2332] to-[#2d3a4f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-6">Ready to Honor Your Loved One?</h2>
          <p className="text-gray-300 text-lg mb-8">Let us help you create a beautiful and lasting memorial.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="px-8 py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">Book a Niche</Link>
            <Link to="/contact" className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#1a2332] transition-all">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
