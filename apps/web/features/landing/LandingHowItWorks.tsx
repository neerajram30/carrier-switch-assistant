'use client';

import React from 'react';
import { Upload, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Ingest & Calibrate Baseline',
    description:
      'Upload your resume or enter your experience. Our system quantifies your competencies into verified skill nodes with zero guesswork.',
    icon: <Upload className="w-5 h-5 text-[#98a4f7]" />,
  },
  {
    step: '02',
    title: 'Select Destination & Analyze Gaps',
    description:
      'Choose your target role from our production path catalog. We identify transferable strengths and isolate high-priority skill gaps.',
    icon: <Compass className="w-5 h-5 text-emerald-400" />,
  },
  {
    step: '03',
    title: 'Execute 12-Week Sprint Roadmap',
    description:
      'Work through daily bite-sized tasks, hands-on architectural projects, and verification checkpoints to reach verified hiring readiness.',
    icon: <CheckCircle2 className="w-5 h-5 text-[#f472b6]" />,
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 reveal-init">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            How The Transition Engine Works
          </h2>
          <p className="text-base sm:text-lg text-[#c9d3ee]">
            From your current stack to your dream role in three evidence-based phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="glass-sre-card rounded-2xl p-7 relative flex flex-col justify-between reveal-init"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-mono font-bold text-[#646e87]">
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#0f101a] border border-[#1f2433] flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-[#c9d3ee] leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#1f2433] flex items-center justify-between text-xs text-[#98a4f7]">
                <span>Phase {step.step} Telemetry</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
