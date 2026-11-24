'use client';

import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';

const COMPARISONS = [
  {
    topic: 'Skill Gap Discovery',
    traditional: 'Guessing what hiring managers look for through random blog posts',
    assistant: 'Quantified gap matrix calibrated against 10,000+ live job requisitions',
  },
  {
    topic: 'Curriculum & Structure',
    traditional: '40-hour video tutorial dumps with zero daily execution structure',
    assistant: '12-week focused sprints broken into 45-minute actionable daily tasks',
  },
  {
    topic: 'Readiness Feedback',
    traditional: 'Failing live technical screens with zero diagnostic clarity',
    assistant: 'Real-time readiness telemetry, velocity metrics, and streak accountability',
  },
  {
    topic: 'Existing Experience',
    traditional: 'Feeling like you have to start over from scratch as a junior',
    assistant: 'Highlights and leverages your transferable senior engineering strengths',
  },
];

export function LandingComparison() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 reveal-init">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            Traditional Guesswork vs. SRE Telemetry
          </h2>
          <p className="text-base sm:text-lg text-[#c9d3ee]">
            Why software engineers switch roles 2.5x faster with structured roadmaps.
          </p>
        </div>

        <div className="glass-sre-card rounded-2xl overflow-hidden border border-[#1f2433] reveal-init">
          <div className="grid grid-cols-1 md:grid-cols-12 bg-[#0f101a] border-b border-[#1f2433] text-xs font-semibold uppercase tracking-wider py-4 px-6 text-[#646e87]">
            <div className="md:col-span-3">Dimension</div>
            <div className="md:col-span-4 text-rose-400">The Traditional Way</div>
            <div className="md:col-span-5 text-[#98a4f7]">With Career Switch Assistant</div>
          </div>

          <div className="divide-y divide-[#1f2433]">
            {COMPARISONS.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 p-6 gap-4 items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="md:col-span-3 font-semibold text-white text-sm">
                  {row.topic}
                </div>
                <div className="md:col-span-4 flex items-start gap-2.5 text-xs text-[#c9d3ee]/80">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{row.traditional}</span>
                </div>
                <div className="md:col-span-5 flex items-start gap-2.5 text-xs text-white font-medium bg-[#5b63d3]/10 p-3 rounded-xl border border-[#5b63d3]/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{row.assistant}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
