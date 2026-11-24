'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does Career Switch Assistant benchmark my existing skills?',
    a: 'When you upload your resume or enter your background, our ingestion engine extracts verified proficiencies, libraries, architectural designs, and years of experience. We map these against a database of 10,000+ real job requisitions to calculate transferable strengths and high-priority gaps.',
  },
  {
    q: 'How are the 12-week roadmaps structured?',
    a: 'Each roadmap is organized into progressive weekly milestones. Each milestone has 5 structured daily tasks (approx 45 minutes each), consisting of a concept focus, practical code action item, and verification checkpoint. You can complete them at your own pace.',
  },
  {
    q: 'Can I switch from Frontend to AI or Backend engineering?',
    a: 'Yes! Career Switch Assistant specializes in adjacent and cross-discipline software transitions: Frontend to Full-Stack AI, QA to SRE, Backend to Cloud Architecture, and more. Our simulator shows you which skills carry over directly.',
  },
  {
    q: 'Is my resume and career data kept private?',
    a: 'Absolutely. We treat career data with enterprise-grade privacy standards. Your resume and skills are encrypted at rest and in transit. Your personal information is never shared with third parties or used to train public foundation models.',
  },
  {
    q: 'Is there a free tier to get started?',
    a: 'Yes, you can upload your resume, receive a baseline skills extraction, test the role simulator, and generate your custom roadmap completely free without a credit card.',
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal-init">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#c9d3ee]">
            Everything you need to know about engineering career transitions.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <details
              key={idx}
              className="group glass-sre-card rounded-xl p-5 border border-[#1f2433] transition-colors duration-200 cursor-pointer open:border-[#98a4f7]/40 reveal-init"
            >
              <summary className="flex items-center justify-between font-semibold text-white text-base sm:text-lg list-none focus:outline-none">
                <span>{faq.q}</span>
                <span className="ml-4 flex-shrink-0 text-[#98a4f7] transition-transform duration-200 group-open:rotate-180">
                  <ChevronDown className="w-5 h-5" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#c9d3ee] leading-relaxed border-t border-[#1f2433] pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
