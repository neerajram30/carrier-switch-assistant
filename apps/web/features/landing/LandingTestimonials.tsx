'use client';

import React from 'react';
import { Star, ArrowRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Elena Rostova',
    fromRole: 'Frontend Developer (3 yrs)',
    toRole: 'Senior Full-Stack & AI Engineer',
    company: 'Fintech Series B',
    quote:
      'I was stuck in tutorial hell trying to learn backend and AI on weekends. The 12-week roadmap gave me exact daily 45-minute architectural tasks. In 3 months, I cleared senior full-stack loops with multiple offers.',
    initials: 'ER',
    gradient: 'from-purple-500 to-indigo-500',
    duration: '11 weeks to offer',
  },
  {
    name: 'Marcus Chen',
    fromRole: 'QA Automation Engineer',
    toRole: 'Site Reliability & Platform Eng',
    company: 'Cloud Scale Inc.',
    quote:
      'Most platforms made me feel like my testing experience was useless. Career Switch Assistant mapped my automated testing and CI/CD competencies directly into SRE skill points. It saved me at least 6 months of wandering.',
    initials: 'MC',
    gradient: 'from-blue-500 to-cyan-500',
    duration: '9 weeks to offer',
  },
  {
    name: 'David Patel',
    fromRole: 'Ruby/Rails Backend Developer',
    toRole: 'AI Application Engineer',
    company: 'Applied AI Lab',
    quote:
      'The market calibration is unreal. Instead of generic machine learning math, it had me building PGVector hybrid search, evaluation harnesses, and streaming pipelines — the exact questions asked in my system design rounds.',
    initials: 'DP',
    gradient: 'from-pink-500 to-rose-500',
    duration: '12 weeks to offer',
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 reveal-init">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151621] border border-[#1f2433] text-xs font-semibold text-[#98a4f7] mb-4">
            <span>VERIFIED OUTCOMES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            Engineers Who Closed The Gap
          </h2>
          <p className="text-base sm:text-lg text-[#c9d3ee]">
            Real engineers who switched trajectories using evidence-based milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="glass-sre-card rounded-2xl p-7 flex flex-col justify-between reveal-init"
            >
              <div>
                {/* Transition trajectory badge */}
                <div className="bg-[#0f101a] p-3 rounded-xl border border-[#1f2433] mb-5">
                  <div className="text-[11px] text-[#646e87] flex items-center justify-between mb-1">
                    <span>Career Trajectory</span>
                    <span className="text-emerald-400 font-semibold">{item.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="text-[#c9d3ee] truncate">{item.fromRole}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#98a4f7] shrink-0" />
                    <span className="text-white truncate">{item.toRole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-[#c9d3ee] leading-relaxed mb-6 italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[#1f2433] flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                >
                  {item.initials}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                  <p className="text-xs text-[#646e87]">{item.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
