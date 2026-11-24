'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Menu, X, ChevronRight } from 'lucide-react';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0f101a]/90 backdrop-blur-md border-b border-[#1f2433] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#98a4f7] rounded-lg p-1"
          aria-label="Career Switch Assistant Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b63d3] to-[#7c87f7] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] transition-transform duration-200 group-hover:scale-105">
            <Compass className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-tight text-[15px] sm:text-[16px] leading-tight">
              Career Switch <span className="text-[#98a4f7]">Assistant</span>
            </span>
            <span className="text-[10px] text-[#646e87] font-medium tracking-wide uppercase">
              SRE & AI Flight Deck
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-7 text-[14px] text-[#c9d3ee] font-medium"
          aria-label="Main Navigation"
        >
          <a
            href="#features"
            className="hover:text-white transition-colors duration-150 focus:outline-none focus:text-white"
          >
            Features
          </a>
          <a
            href="#simulator"
            className="hover:text-white transition-colors duration-150 focus:outline-none focus:text-white"
          >
            Role Simulator
          </a>
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors duration-150 focus:outline-none focus:text-white"
          >
            How It Works
          </a>
          <a
            href="#faq"
            className="hover:text-white transition-colors duration-150 focus:outline-none focus:text-white"
          >
            FAQ
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[14px] text-[#c9d3ee] hover:text-white px-3.5 py-2 rounded-full hover:bg-white/[0.04] transition-colors font-medium"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="btn-midnight-primary inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Sign up free</span>
            <ChevronRight className="w-4 h-4 text-white/80" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/login"
            className="text-[13px] text-[#c9d3ee] px-2.5 py-1.5 font-medium hover:text-white"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#151621] border border-[#1f2433] text-[#c9d3ee] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#98a4f7]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0f101a] border-b border-[#1f2433] px-4 pt-3 pb-6 space-y-3 animate-fade-in-up">
          <div className="flex flex-col space-y-2 text-[15px] font-medium text-[#c9d3ee]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151621] hover:text-white"
            >
              Features
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151621] hover:text-white"
            >
              Role Simulator
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151621] hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151621] hover:text-white"
            >
              FAQ
            </a>
            <Link
              href="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151621] text-emerald-400 text-sm flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Systems Telemetry
            </Link>
          </div>

          <div className="pt-3 border-t border-[#1f2433] flex flex-col gap-2">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-midnight-primary w-full text-center py-2.5 rounded-full text-white font-medium text-[14px]"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
