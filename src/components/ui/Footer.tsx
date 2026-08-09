import React from 'react';
import { Link } from 'react-router-dom';
import { useCMS } from '@/hooks/useCMS';

export default function Footer() {
  const { settings } = useCMS(['settings']);

  const siteName  = settings['site_name']  || 'EternaRest';
  const phone     = settings['site_phone'] || '+250794890144';
  const email     = settings['site_email'] || 'info@eternarest.com';
  const address   = settings['address']    || 'Kigali, Rwanda';
  const facebook  = settings['facebook']   || '#';
  const instagram = settings['instagram']  || '#';
  const whatsapp  = settings['whatsapp']   || '250794890144';
  return (
    <footer className="bg-[#1a2332] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-2xl font-serif font-bold text-[#d4af37]">{siteName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Honoring lives, preserving memories forever. We provide dignified digital memorials 
              and burial niche services for your loved ones.
            </p>
            <div className="flex space-x-4">
              <a href={facebook !== '#' ? facebook : '#'} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#d4af37] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href={instagram !== '#' ? instagram : '#'} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#d4af37] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href={`https://wa.me/${whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#d4af37] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M16.003 3.2C9.006 3.2 3.2 9.006 3.2 16.003c0 2.26.59 4.47 1.713 6.42L3.2 28.8l6.53-1.693a12.72 12.72 0 006.273 1.652h.006c6.997 0 12.8-5.803 12.8-12.8C28.809 9.006 23.003 3.2 16.003 3.2zm5.803 17.524c-.317-.16-1.877-.926-2.168-1.03-.29-.104-.5-.16-.71.16-.21.317-.813 1.03-.996 1.24-.183.21-.367.237-.684.08-.317-.157-1.34-.493-2.553-1.573-.943-.84-1.58-1.877-1.764-2.194-.183-.317-.02-.487.138-.644.14-.14.317-.367.476-.55.158-.183.21-.317.316-.527.104-.21.053-.394-.027-.55-.08-.157-.71-1.717-.973-2.35-.257-.616-.516-.533-.71-.543l-.603-.01c-.21 0-.55.08-.837.394-.29.317-1.1 1.073-1.1 2.617 0 1.543 1.127 3.034 1.283 3.244.157.21 2.217 3.386 5.374 4.745.75.323 1.337.516 1.793.66.754.237 1.44.203 1.983.123.604-.09 1.877-.766 2.143-1.507.263-.74.263-1.373.184-1.507-.08-.13-.29-.21-.607-.367z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-[#d4af37]">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">Home</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors text-sm">Our Services</Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-400 hover:text-white transition-colors text-sm">Search Memorial</Link>
              </li>
              <li>
                <Link to="/book" className="text-gray-400 hover:text-white transition-colors text-sm">Book a Niche</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-[#d4af37]">Our Services</h3>
            <ul className="space-y-3">
              <li className="text-gray-400 text-sm">Digital Memorials</li>
              <li className="text-gray-400 text-sm">Burial Niche Booking</li>
              <li className="text-gray-400 text-sm">QR Code Memorials</li>
              <li className="text-gray-400 text-sm">Photo & Video Tributes</li>
              <li className="text-gray-400 text-sm">Condolence Messages</li>
              <li className="text-gray-400 text-sm">Memorial Preservation</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-[#d4af37]">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400 text-sm">{address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-400 text-sm">{phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400 text-sm">{email}</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400 text-sm">Open 24/7 for Online Services</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
