'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface RoleOption {
  id: string;
  label: string;
}

interface TargetPath {
  id: string;
  title: string;
  readinessMap: Record<string, number>;
  estimatedWeeks: Record<string, number>;
  salaryRange: string;
  demandIndex: number;
  transferable: Record<string, string[]>;
  gaps: string[];
}

const CURRENT_ROLES: RoleOption[] = [
  { id: 'frontend', label: 'Frontend Developer' },
  { id: 'backend', label: 'Backend Developer' },
  { id: 'qa', label: 'QA / Automation Engineer' },
  { id: 'fullstack', label: 'Full-Stack Developer' },
  { id: 'devops', label: 'DevOps / SysAdmin' },
];

const TARGET_PATHS: TargetPath[] = [
  {
    id: 'ai-engineer',
    title: 'AI / LLM Application Engineer',
    salaryRange: '$170,000 – $225,000',
    demandIndex: 96,
    readinessMap: {
      frontend: 72,
      backend: 81,
      qa: 64,
      fullstack: 86,
      devops: 75,
    },
    estimatedWeeks: {
      frontend: 10,
      backend: 8,
      qa: 14,
      fullstack: 6,
      devops: 10,
    },
    transferable: {
      frontend: ['Modern TypeScript', 'Client state & streaming UX', 'API consumption'],
      backend: ['Relational databases', 'REST/gRPC APIs', 'Asynchronous queues'],
      qa: ['Test assertions & fixtures', 'Python scripting', 'CI/CD pipeline validation'],
      fullstack: ['Full-stack TypeScript', 'Next.js API routes', 'PostgreSQL querying'],
      devops: ['Containerization (Docker)', 'Cloud provisioning', 'Telemetry & monitoring'],
    },
    gaps: [
      'Vector Embeddings & Cosine Search (PGVector)',
      'Prompt Engineering & Evaluation Harnesses',
      'RAG Context Chunking & Re-ranking',
    ],
  },
  {
    id: 'platform-sre',
    title: 'Site Reliability & Platform Engineer',
    salaryRange: '$165,000 – $215,000',
    demandIndex: 92,
    readinessMap: {
      frontend: 58,
      backend: 79,
      qa: 68,
      fullstack: 76,
      devops: 92,
    },
    estimatedWeeks: {
      frontend: 14,
      backend: 8,
      qa: 12,
      fullstack: 8,
      devops: 4,
    },
    transferable: {
      frontend: ['Build tool pipelines', 'Client performance budgets', 'Error boundary handling'],
      backend: ['Database indexing', 'Distributed concurrency', 'Microservice communications'],
      qa: ['Automated regression suites', 'Chaos testing', 'Synthetic monitoring'],
      fullstack: ['Production debugging', 'Node runtime bottlenecks', 'Service health checks'],
      devops: ['Terraform IaC', 'Kubernetes workloads', 'Prometheus & Grafana alerts'],
    },
    gaps: [
      'SLO / SLI Error Budget Engineering',
      'Distributed Tracing with OpenTelemetry',
      'Zero-Downtime Database Migration Strategies',
    ],
  },
  {
    id: 'staff-fullstack',
    title: 'Staff Full-Stack Architect',
    salaryRange: '$180,000 – $240,000',
    demandIndex: 94,
    readinessMap: {
      frontend: 80,
      backend: 82,
      qa: 60,
      fullstack: 91,
      devops: 70,
    },
    estimatedWeeks: {
      frontend: 8,
      backend: 8,
      qa: 16,
      fullstack: 4,
      devops: 12,
    },
    transferable: {
      frontend: ['Component system design', 'Web vitals optimization', 'Server-side rendering'],
      backend: ['SQL performance optimization', 'Domain modeling', 'Auth & session protocols'],
      qa: ['End-to-end test strategies', 'Quality gates', 'Contract validation'],
      fullstack: ['Holistic system architecture', 'TypeScript end-to-end', 'API contract design'],
      devops: ['Deployment pipelines', 'Cloud networking', 'Security posture'],
    },
    gaps: [
      'High-Scale Distributed Caching (Redis/Keyv)',
      'Cross-Service Event-Driven Architecture',
      'Technical RFC Leadership & Decision Records',
    ],
  },
];

export function CareerSwitchSimulator() {
  const [currentRole, setCurrentRole] = useState<string>('frontend');
  const [targetRoleId, setTargetRoleId] = useState<string>('ai-engineer');

  const selectedTarget =
    TARGET_PATHS.find((t) => t.id === targetRoleId) || TARGET_PATHS[0];

  const readiness = selectedTarget.readinessMap[currentRole] || 75;
  const weeks = selectedTarget.estimatedWeeks[currentRole] || 10;
  const transferableSkills = selectedTarget.transferable[currentRole] || [];

  return (
    <section id="simulator" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 reveal-init">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            Simulate Your Transition Velocity
          </h2>
          <p className="text-base sm:text-lg text-[#c9d3ee]">
            Select your baseline experience and see how quickly your existing skills
            transfer into today&apos;s highest-demand software roles.
          </p>
        </div>

        {/* Interactive Calculator Box */}
        <div className="glass-sre-card rounded-2xl p-6 sm:p-8 lg:p-10 border border-[#1f2433] reveal-init">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#646e87] mb-2.5">
                  1. Where are you currently?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CURRENT_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setCurrentRole(role.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center justify-between ${
                        currentRole === role.id
                          ? 'bg-[#5b63d3]/15 border-[#98a4f7] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]'
                          : 'bg-[#0f101a] border-[#1f2433] text-[#c9d3ee] hover:border-[#939db8]/40 hover:text-white'
                      }`}
                    >
                      <span>{role.label}</span>
                      {currentRole === role.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#98a4f7]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#646e87] mb-2.5">
                  2. Select your target destination:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TARGET_PATHS.map((path) => (
                    <button
                      key={path.id}
                      type="button"
                      onClick={() => setTargetRoleId(path.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center justify-between ${
                        targetRoleId === path.id
                          ? 'bg-[#5b63d3]/15 border-[#98a4f7] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]'
                          : 'bg-[#0f101a] border-[#1f2433] text-[#c9d3ee] hover:border-[#939db8]/40 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{path.title}</span>
                      {targetRoleId === path.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#98a4f7] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Telemetry Results Preview */}
            <div className="lg:col-span-7 bg-[#0f101a] rounded-xl border border-[#1f2433] p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f2433] mb-6">
                  <div>
                    <span className="text-[11px] text-[#646e87] font-semibold uppercase tracking-wider block">
                      Target Role Trajectory
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      {selectedTarget.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#646e87] block">Market Compensation</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {selectedTarget.salaryRange}
                    </span>
                  </div>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#151621] p-3.5 rounded-lg border border-[#1f2433]">
                    <span className="text-[11px] text-[#646e87] block mb-1">
                      Readiness Match
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white">{readiness}%</span>
                      <span className="text-xs text-emerald-400 font-medium">Transferable</span>
                    </div>
                    <div className="w-full bg-[#0f101a] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#5b63d3] to-[#98a4f7] h-full rounded-full transition-all duration-500"
                        style={{ width: `${readiness}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-[#151621] p-3.5 rounded-lg border border-[#1f2433]">
                    <span className="text-[11px] text-[#646e87] block mb-1">
                      Target Sprint Time
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white">{weeks}</span>
                      <span className="text-xs text-[#c9d3ee]">Weeks</span>
                    </div>
                    <p className="text-[10px] text-[#646e87] mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#98a4f7]" />
                      5–7 hrs/wk deliberate practice
                    </p>
                  </div>

                  <div className="bg-[#151621] p-3.5 rounded-lg border border-[#1f2433]">
                    <span className="text-[11px] text-[#646e87] block mb-1">
                      Hiring Demand
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white">
                        {selectedTarget.demandIndex}/100
                      </span>
                      <span className="text-xs text-[#f472b6] font-medium">Very High</span>
                    </div>
                    <p className="text-[10px] text-[#646e87] mt-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      Requisitions surging +34%
                    </p>
                  </div>
                </div>

                {/* Transferable Strengths & High Priority Gaps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#151621]/60 p-3.5 rounded-lg border border-[#1f2433]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Your Transferable Strengths</span>
                    </div>
                    <ul className="space-y-1.5">
                      {transferableSkills.map((skill, idx) => (
                        <li key={idx} className="text-xs text-[#c9d3ee] flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#151621]/60 p-3.5 rounded-lg border border-[#1f2433]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#98a4f7] mb-2">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Key Gaps To Bridge</span>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedTarget.gaps.map((gap, idx) => (
                        <li key={idx} className="text-xs text-[#c9d3ee] flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#98a4f7]"></span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#1f2433] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[#646e87]">
                  No credit card required. Free roadmap generation.
                </p>
                <Link
                  href={`/signup?current=${currentRole}&target=${targetRoleId}`}
                  className="btn-midnight-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
                >
                  <span>Build My Tailored Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
