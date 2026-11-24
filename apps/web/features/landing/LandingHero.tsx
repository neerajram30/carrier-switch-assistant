'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CheckCircle2,
  CircleDot,
  Compass,
  Flame,
  ChevronRight,
} from 'lucide-react';

export function LandingHero() {
  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-20 sm:pb-28 overflow-hidden">
      {/* Ambient background glows with subtle depth parallax */}
      <div
        className="ambient-glow-iris w-[500px] h-[500px] -top-32 -left-20 sm:-top-20 sm:left-10"
        aria-hidden="true"
        data-parallax="0.18"
        data-parallax-limit="100"
      />
      <div
        className="ambient-glow-pink w-[550px] h-[550px] top-40 -right-20 sm:right-10"
        aria-hidden="true"
        data-parallax="-0.15"
        data-parallax-limit="80"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Main Headline (Multi-line punchy typography like reference) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-white uppercase leading-[1.04] mb-6">
              <span className="block animate-fade-in-up">Assess Skills.</span>
              <span className="block animate-fade-in-up-delay-1 text-[#c9d3ee]">
                Target Roles.
              </span>
              <span className="block animate-fade-in-up-delay-1">
                Bridge The Gaps.
              </span>
              <span className="block animate-fade-in-up-delay-2 bg-gradient-to-r from-[#98a4f7] via-[#c084fc] to-[#f472b6] text-transparent bg-clip-text">
                One Platform.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-[#c9d3ee] max-w-2xl font-normal leading-relaxed mb-8">
              The evidence-based career transition platform helping software engineers
              benchmark verified skills, eliminate career guesswork, and execute
              tailored 12-week roadmaps.
            </p>

            {/* CTA Buttons: Connect to signup and login */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link
                href="/signup"
                className="btn-midnight-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all duration-200 shadow-[0_2px_15px_rgba(91,99,211,0.35)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <ChevronRight className="w-4 h-4 text-white/90" aria-hidden="true" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#151621] text-white border border-[#1f2433] hover:border-[#98a4f7]/50 hover:bg-[#1a1b2a] transition-all duration-200 font-medium text-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Log in</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Floating Product Cards Showcase (Matching Beehiiv Style with GPU Parallax) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
            <div className="relative w-full max-w-[460px] sm:max-w-[500px]">
              {/* Back Card 1: Target Role & Readiness (Digital Products equivalent) */}
              <div
                className="parallax-layer relative z-10"
                data-parallax="0.04"
                data-parallax-limit="40"
              >
                <div className="glass-sre-card rounded-2xl p-5 sm:p-6 transition-transform duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#1f2433] mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#5b63d3]/20 border border-[#5b63d3]/40 flex items-center justify-center text-[#98a4f7]">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#98a4f7] block">
                          Target Path Telemetry
                        </span>
                        <h2 className="text-sm font-semibold text-white">
                          Senior Full-Stack & AI Engineer
                        </h2>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      82% Ready
                    </span>
                  </div>

                  {/* Role Gradient Visual Box */}
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-[#1e1e38] via-[#241c40] to-[#121324] border border-[#1f2433] p-4 flex flex-col justify-between mb-4 relative overflow-hidden">
                    <div className="ambient-glow-iris w-36 h-36 -top-10 -right-10 opacity-70" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-xs text-[#c9d3ee] font-medium">Hiring Benchmark</span>
                      <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                        $165k – $215k
                      </span>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#c9d3ee]">Core Skill Match</span>
                        <span className="text-emerald-400 font-semibold">14 / 17 Verified</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#0f101a] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#5b63d3] to-[#98a4f7] rounded-full w-[82%]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Verified Skills vs Gaps Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#646e87]">
                      <span>Transferable Strengths</span>
                      <span className="text-xs text-[#98a4f7]">3 High-Priority Gaps</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-md bg-[#1f2433]/70 border border-[#939db8]/20 text-[11px] text-white font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        TypeScript
                      </span>
                      <span className="px-2 py-1 rounded-md bg-[#1f2433]/70 border border-[#939db8]/20 text-[11px] text-white font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Next.js 15
                      </span>
                      <span className="px-2 py-1 rounded-md bg-[#1f2433]/70 border border-[#939db8]/20 text-[11px] text-white font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        PostgreSQL
                      </span>
                      <span className="px-2 py-1 rounded-md bg-[#5b63d3]/15 border border-[#5b63d3]/40 text-[11px] text-[#98a4f7] font-medium flex items-center gap-1">
                        <CircleDot className="w-3 h-3 text-[#98a4f7]" />
                        Vector Embeddings
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlapping Floating Card 2: Velocity & Streak (Parallax Foreground Shift) */}
              <div
                className="parallax-layer absolute -bottom-8 -left-4 sm:-left-8 z-20 w-52 sm:w-60 pointer-events-auto"
                data-parallax="-0.14"
                data-parallax-limit="85"
              >
                <div className="glass-sre-card rounded-xl p-3.5 sm:p-4 animate-float-slow shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#646e87] font-medium">Readiness Velocity</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <TrendingUp className="w-3 h-3" />
                      +18%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-white tracking-tight">84 / 100</span>
                    <span className="text-xs text-[#c9d3ee]">Index</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1f2433] text-[11px] text-[#c9d3ee]">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>14-day study streak active</span>
                  </div>
                </div>
              </div>

              {/* Overlapping Floating Card 3: Live Milestone Tasks (Parallax Midground Counter-Shift) */}
              <div
                className="parallax-layer absolute -top-8 -right-4 sm:-right-8 z-20 w-60 sm:w-64 pointer-events-auto"
                data-parallax="0.10"
                data-parallax-limit="70"
              >
                <div className="glass-sre-card rounded-xl p-4 animate-float-reverse shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#f472b6]"></span>
                      <span className="text-[11px] font-semibold text-white">Sprint Week 4</span>
                    </div>
                    <span className="text-[10px] text-[#98a4f7] font-medium">Day 24 of 84</span>
                  </div>
                  <p className="text-xs text-white font-medium mb-2.5 truncate">
                    RAG Pipeline & Hybrid Search
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-white bg-[#0f101a]/60 px-2 py-1.5 rounded-lg border border-[#1f2433]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">PGVector cosine search</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#c9d3ee] bg-[#0f101a]/30 px-2 py-1.5 rounded-lg border border-[#1f2433]/60">
                      <CircleDot className="w-3.5 h-3.5 text-[#98a4f7] shrink-0" />
                      <span className="truncate">Latency benchmarking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
