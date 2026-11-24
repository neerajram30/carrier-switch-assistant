'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-[#1f2433] bg-[#0c0d15] text-[#c9d3ee] text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#1f2433]/70">
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Career Switch Assistant Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5b63d3] to-[#7c87f7] flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                Career Switch Assistant
              </span>
            </Link>
            <p className="text-xs text-[#646e87] max-w-sm leading-relaxed">
              The evidence-based career transition platform for software engineers.
              Benchmark verified skills, isolate technical bottlenecks, and execute structured
              12-week transition sprints.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#646e87]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <Link href="/status" className="hover:text-white transition-colors">
                All systems operational · SRE Console
              </Link>
            </div>
          </div>

          {/* Nav columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div>
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
                Platform
              </h3>
              <ul className="space-y-2 text-[#646e87]">
                <li>
                  <a href="#simulator" className="hover:text-white transition-colors">
                    Role Simulator
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Gap Analysis
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    Sprint Engine
                  </a>
                </li>
                <li>
                  <Link href="/explore" className="hover:text-white transition-colors">
                    Path Explorer
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
                Resources
              </h3>
              <ul className="space-y-2 text-[#646e87]">
                <li>
                  <Link href="/status" className="hover:text-white transition-colors">
                    System Telemetry
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Knowledge Base
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Engineer Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white transition-colors">
                    Create Free Account
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
                Security & Legal
              </h3>
              <ul className="space-y-2 text-[#646e87]">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Encrypted Data</span>
                </li>
                <li className="text-[11px] text-[#646e87]">Zero LLM Data Retention</li>
                <li className="text-[11px] text-[#646e87]">Advisory Only Notice</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Advisory statement per product principles */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#646e87]">
          <p>
            © {new Date().getFullYear()} Career Switch Assistant. Built with Next.js and NestJS.
          </p>
          <p className="text-center sm:text-right max-w-md">
            Career Switch Assistant provides advisory recommendations and evidence-based
            roadmaps; outcomes vary by individual deliberate practice and hiring market conditions.
          </p>
        </div>
      </div>
    </footer>
  );
}
