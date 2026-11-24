'use client';

import React from 'react';
import {
  FileText,
  BarChart3,
  Calendar,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <FileText className="w-5 h-5 text-[#98a4f7]" />,
    tag: 'INTELLIGENT INGESTION',
    title: 'One-Click Experience Telemetry',
    description:
      'Upload your PDF resume or LinkedIn profile. Our parsing engine automatically verifies existing proficiencies, years of experience, and project architecture.',
    visual: (
      <div className="bg-[#0f101a] rounded-xl border border-[#1f2433] p-4 text-xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f2433]">
          <span className="text-[#646e87]">Extracted Entity</span>
          <span className="text-emerald-400 font-medium">100% Parsed</span>
        </div>
        <div className="flex items-center justify-between text-[#c9d3ee]">
          <span>Full-Stack Experience</span>
          <span className="text-white font-mono">4.5 yrs</span>
        </div>
        <div className="flex items-center justify-between text-[#c9d3ee]">
          <span>Verified Competencies</span>
          <span className="text-white font-mono">18 skills</span>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-emerald-400 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Zero manual data entry required</span>
        </div>
      </div>
    ),
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    tag: 'OBJECTIVE BENCHMARKING',
    title: 'Market-Calibrated Gap Analysis',
    description:
      'No vague advice. We cross-reference your skills against real production hiring requisitions to identify high-signal gaps that make or break technical screens.',
    visual: (
      <div className="bg-[#0f101a] rounded-xl border border-[#1f2433] p-4 text-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f2433]">
          <span className="text-[#646e87]">Priority Calibration</span>
          <span className="text-xs text-[#98a4f7] font-semibold">High Signal</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-white">Distributed Caching</span>
            <span className="text-rose-400 font-mono text-[11px]">Priority 1 Gap</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white">Vector Search & RAG</span>
            <span className="text-amber-400 font-mono text-[11px]">Priority 2 Gap</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white">Next.js & React 19</span>
            <span className="text-emerald-400 font-mono text-[11px]">Verified Match</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Calendar className="w-5 h-5 text-[#f472b6]" />,
    tag: 'ACTIONABLE SPRINT ENGINE',
    title: '12-Week Day-by-Day Roadmaps',
    description:
      'Avoid tutorial paralysis. Receive structured weekly milestones broken into bite-sized daily tasks with learning focus, hands-on action items, and verification checks.',
    visual: (
      <div className="bg-[#0f101a] rounded-xl border border-[#1f2433] p-4 text-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f2433]">
          <span className="text-white font-medium">Sprint 03: Event Queues</span>
          <span className="text-xs text-[#98a4f7]">Week 3 of 12</span>
        </div>
        <div className="space-y-1">
          <div className="p-2 rounded bg-[#151621] border border-[#1f2433] flex items-center justify-between">
            <span className="text-[#c9d3ee] truncate">Day 15: Kafka vs BullMQ patterns</span>
            <span className="text-[#646e87] text-[10px]">45m</span>
          </div>
          <div className="p-2 rounded bg-[#151621] border border-[#1f2433] flex items-center justify-between">
            <span className="text-[#c9d3ee] truncate">Day 16: Idempotent Consumer lab</span>
            <span className="text-[#646e87] text-[10px]">60m</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Activity className="w-5 h-5 text-[#a855f7]" />,
    tag: 'CAREER FLIGHT DECK',
    title: 'Real-Time Readiness Telemetry',
    description:
      'Watch your readiness score climb as you complete daily milestones. Maintain streaks, benchmark velocity, and inspect transition health like an SRE monitoring production.',
    visual: (
      <div className="bg-[#0f101a] rounded-xl border border-[#1f2433] p-4 text-xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f2433]">
          <span className="text-[#646e87]">Readiness Health</span>
          <span className="text-emerald-400 font-semibold">+22% Sprint Gain</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#c9d3ee]">Active Streak</span>
          <span className="text-orange-400 font-bold">18 Days Active 🔥</span>
        </div>
        <div className="w-full bg-[#151621] h-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#5b63d3] to-emerald-400 w-[78%]"></div>
        </div>
      </div>
    ),
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 reveal-init">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151621] border border-[#1f2433] text-xs font-semibold text-[#98a4f7] mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>ARCHITECTED FOR ENGINEERS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            Built Like An SRE Console For Your Career
          </h2>
          <p className="text-base sm:text-lg text-[#c9d3ee]">
            No vague motivational fluff. We treat career switches as a structured engineering
            system: measure baselines, isolate bottlenecks, and execute systematic sprints.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="glass-sre-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 reveal-init"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0f101a] border border-[#1f2433] flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-[#98a4f7] px-2.5 py-1 rounded-full bg-[#5b63d3]/10 border border-[#5b63d3]/20">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#c9d3ee] leading-relaxed mb-6">
                  {feature.description}
                </p>
              </div>

              <div className="mt-auto pt-2">{feature.visual}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
