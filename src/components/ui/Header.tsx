import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCMS } from '@/hooks/useCMS';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { settings } = useCMS(['settings']);

  const siteName = settings['site_name'] || 'EternaRest';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Search Memorial', path: '/search' },
    { name: 'Book a Niche', path: '/book' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-[#1a2332] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-[#d4af37]">{siteName}</span>
              <p className="text-xs text-gray-400 -mt-1">Digital Memorials</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-[#d4af37] text-[#1a2332]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/admin"
              className="ml-4 px-4 py-2 border border-[#d4af37] text-[#d4af37] rounded-lg text-sm font-medium hover:bg-[#d4af37] hover:text-[#1a2332] transition-all duration-200"
            >
              Admin
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-white/10 mt-2 pt-4">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-[#d4af37] text-[#1a2332]'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 border border-[#d4af37] text-[#d4af37] rounded-lg text-sm font-medium text-center hover:bg-[#d4af37] hover:text-[#1a2332] transition-all duration-200"
              >
                Admin Dashboard
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
