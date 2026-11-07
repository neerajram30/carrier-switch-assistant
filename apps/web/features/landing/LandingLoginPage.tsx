'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import {
  Compass,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface LandingLoginPageProps {
  onLoginSuccess?: (email: string, name?: string) => void;
}

export default function LandingLoginPage({
  onLoginSuccess,
}: LandingLoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('dev-user@example.com');
  const [name, setName] = useState('Alex Morgan');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email format');
      return;
    }

    setEmailError(null);
    setIsSubmitting(true);

    if (onLoginSuccess) {
      onLoginSuccess(trimmedEmail, name.trim());
    }

    // Micro-delay for smooth transition feel
    setTimeout(() => {
      router.push('/onboarding');
    }, 280);
  };

  const handleQuickDemo = () => {
    setEmail('dev-user@example.com');
    setName('Alex Morgan');
    setEmailError(null);
    setIsSubmitting(true);

    if (onLoginSuccess) {
      onLoginSuccess('dev-user@example.com', 'Alex Morgan');
    }

    setTimeout(() => {
      router.push('/onboarding');
    }, 200);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#0D1117] text-[#F8FAFC] selection:bg-indigo-500/30">
      {/* Background Subtle Ambient Glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[450px] w-[450px] rounded-full bg-indigo-600/10 blur-[130px] animate-pulse-glow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[130px] animate-pulse-glow"
        aria-hidden="true"
      />

      {/* Top Header Navigation Bar */}
      <header className="relative z-10 w-full border-b border-[#252D3D] bg-[#0D1117]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-[#F8FAFC] text-sm sm:text-base">
                Career Switch Assistant
              </span>
              <span className="text-[10px] text-[#94A3B8] font-mono tracking-wider uppercase">
                Software Career Readiness
              </span>
            </div>
          </Link>

          <HStack gap={3} align="center">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 rounded-full border border-[#252D3D] bg-[#161922] px-3.5 py-1.5 text-xs text-[#94A3B8] transition-all hover:border-[#3B465C] hover:text-[#F8FAFC]"
            >
              <StatusDot variant="success" label="Systems Active" />
              <span>System Status</span>
            </Link>
          </HStack>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-14 flex items-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          
          {/* Left Column: Project Details & Value Showcase */}
          <div className="flex flex-col gap-6 lg:col-span-7 animate-fade-in-up">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 shadow-sm shadow-indigo-950/40">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Evidence-Based Transition Platform</span>
            </div>

            <div className="flex flex-col gap-3">
              <Heading
                level={1}
                weight="bold"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  color: '#F8FAFC',
                }}
              >
                Turn your career goals into an{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  actionable roadmap.
                </span>
              </Heading>
              
              <Text
                type="supporting"
                style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.6',
                  color: '#94A3B8',
                  maxWidth: '560px',
                }}
              >
                Career Switch Assistant benchmarks your software engineering
                experience against target roles, uncovers actionable skill gaps,
                and crafts verifiable milestones tailored to your background.
              </Text>
            </div>

            {/* Feature Value Cards Using Design System Theme */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="micro-card-hover rounded-xl border border-[#252D3D] bg-[#161922] p-4 backdrop-blur-sm">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  <FileText className="h-4 w-4" />
                </div>
                <Heading level={3} weight="semibold" style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>
                  Resume Extraction
                </Heading>
                <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                  Fast parsing of PDF & DOCX resumes extracting verified skills
                  and baseline experience.
                </p>
              </div>

              <div className="micro-card-hover rounded-xl border border-[#252D3D] bg-[#161922] p-4 backdrop-blur-sm">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Compass className="h-4 w-4" />
                </div>
                <Heading level={3} weight="semibold" style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>
                  Readiness Indicators
                </Heading>
                <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                  Honest gap analysis against target roles with clear indicators
                  on where to focus.
                </p>
              </div>

              <div className="micro-card-hover rounded-xl border border-[#252D3D] bg-[#161922] p-4 backdrop-blur-sm">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <Heading level={3} weight="semibold" style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>
                  Advisory & Private
                </Heading>
                <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                  Advisory recommendations with full data privacy and zero false
                  hiring promises.
                </p>
              </div>
            </div>

            {/* Trust and Architecture Indicators */}
            <HStack gap={4} align="center" className="text-xs text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#94A3B8]" />
                Private & Secure
              </span>
              <span>•</span>
              <span>TypeScript & NestJS</span>
              <span>•</span>
              <span>PostgreSQL Store</span>
            </HStack>
          </div>

          {/* Right Column: Clean Black Theme Login Card with Astryx Components */}
          <div className="w-full lg:col-span-5 animate-fade-in-up-delay-1">
            <Card
              elevation="low"
              className="relative overflow-hidden rounded-2xl border border-[#252D3D] bg-[#161922] p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl"
            >
              {/* Subtle Card Accent Highlight */}
              <div
                className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"
                aria-hidden="true"
              />

              <VStack gap={5}>
                <VStack gap={1}>
                  <div className="flex items-center justify-between">
                    <Heading level={2} weight="semibold" style={{ color: '#F8FAFC' }}>
                      Sign In
                    </Heading>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/25">
                      Ready
                    </span>
                  </div>
                  <Text type="supporting" color="secondary">
                    Access your career baseline or begin onboarding.
                  </Text>
                </VStack>

                {/* Form with Astryx Inputs */}
                <form onSubmit={handleLogin} noValidate className="w-full">
                  <VStack gap={4}>
                    <TextInput
                      label="Email Address *"
                      placeholder="e.g. dev-user@example.com"
                      value={email}
                      onChange={(val) => {
                        setEmail(val);
                        if (emailError) setEmailError(null);
                      }}
                      status={
                        emailError
                          ? { type: 'error', message: emailError }
                          : undefined
                      }
                      isDisabled={isSubmitting}
                      isRequired
                    />

                    <TextInput
                      label="Developer Name (Optional)"
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(val) => setName(val)}
                      isDisabled={isSubmitting}
                    />

                    <div className="pt-2">
                      <Button
                        label={isSubmitting ? 'Signing in...' : 'Sign In & Open Onboarding →'}
                        variant="primary"
                        isLoading={isSubmitting}
                        onClick={() => handleLogin()}
                        width="100%"
                      />
                    </div>
                  </VStack>
                </form>

                <div className="flex flex-col gap-2 pt-1 border-t border-[#252D3D]">
                  <Button
                    label="One-Click Demo Access ⚡"
                    variant="secondary"
                    onClick={handleQuickDemo}
                    width="100%"
                    isDisabled={isSubmitting}
                  />

                  <div className="flex items-center justify-between pt-1 text-xs text-[#94A3B8]">
                    <span>Need to test system health?</span>
                    <Link
                      href="/status"
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      System Status & Health →
                    </Link>
                  </div>
                </div>
              </VStack>
            </Card>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 w-full border-t border-[#252D3D] bg-[#0D1117]/90 py-4 text-center text-xs text-[#94A3B8]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <p>© 2026 Career Switch Assistant. Evidence-based career readiness.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/status"
              className="transition-colors hover:text-cyan-400"
            >
              System Status & Health →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
