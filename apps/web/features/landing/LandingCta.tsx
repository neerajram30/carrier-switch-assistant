'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';

export function LandingCta() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-sre-card rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#5b63d3]/30 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(91,99,211,0.2)] reveal-init">
          {/* Ambient background accent */}
          <div
            className="ambient-glow-iris w-[500px] h-[500px] -top-40 left-1/2 -translate-x-1/2 opacity-60"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f101a] border border-[#1f2433] text-xs font-semibold text-[#98a4f7] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>START YOUR TRANSITION FLIGHT</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight uppercase mb-6 leading-tight">
              Stop Guessing. <br />
              <span className="bg-gradient-to-r from-[#98a4f7] via-[#c084fc] to-[#f472b6] text-transparent bg-clip-text">
                Start Building Evidence.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#c9d3ee] mb-8 max-w-xl mx-auto leading-relaxed">
              Generate your personalized skill gap matrix and 12-week transition roadmap
              in under 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/signup"
                className="btn-midnight-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              >
                <span>Get Started for Free</span>
                <ChevronRight className="w-5 h-5 text-white/90" />
              </Link>
              <Link
                href="/login"
                className="btn-midnight-ghost inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-white font-medium text-base hover:bg-white/[0.05] transition-all w-full sm:w-auto border border-[#1f2433]"
              >
                <span>Log into Dashboard</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#646e87]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                No credit card required
              </span>
              <span>•</span>
              <span>Instant AI roadmap</span>
              <span>•</span>
              <span>Private & confidential</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
