'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CheckSquare,
  ChevronDown,
  Compass,
  FileUp,
  LayoutDashboard,
  ListTodo,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { StatusDot } from '@astryxdesign/core/StatusDot';

export interface InternalNavbarProps {
  /**
   * Optional title override for current page.
   * If omitted, dynamically infers from route pathname.
   */
  title?: string;
  /**
   * Current navigation section key ('dashboard' | 'explore' | 'track' | 'experience').
   */
  current?: string;
  /**
   * Additional actions or controls to render in navbar.
   */
  actions?: React.ReactNode;
  /**
   * Custom inline style overrides.
   */
  style?: React.CSSProperties;
}

export function InternalNavbar({
  title,
  current,
  actions,
  style,
}: InternalNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile data state with lazy initialization to prevent cascading renders
  const [userProfile] = useState(() => {
    const fallback = {
      name: 'Alex Morgan',
      email: 'dev-user@example.com',
      currentRole: 'Frontend Developer',
      targetRole: '',
    };
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('csa_career_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            return {
              ...fallback,
              currentRole: parsed.currentRole || fallback.currentRole,
              targetRole: parsed.targetRole || '',
            };
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return fallback;
  });

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  // Infer section label if title is not explicitly provided
  const getSectionLabel = () => {
    if (title) return title;
    if (current === 'explore' || pathname?.includes('/explore'))
      return 'Explore Paths';
    if (current === 'track' || pathname?.includes('/track'))
      return 'Track Execution';
    if (
      current === 'experience' ||
      pathname?.includes('/experience') ||
      pathname?.includes('/edit-experience')
    )
      return 'Edit Experience';
    return 'Dashboard Overview';
  };

  const handleSignOut = () => {
    setDropdownOpen(false);
    router.push('/');
  };

  return (
    <header
      data-testid="internal-navbar"
      className="relative z-30 w-full select-none"
      style={{
        height: 42,
        maxHeight: 42,
        minHeight: 42,
        background: 'rgba(15, 16, 26, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Left: Compact Breadcrumb / Context */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/dashboard"
          className="text-[11px] font-medium text-[#646e87] hover:text-[#c9d3ee] transition-colors truncate hidden sm:inline"
        >
          Career Switch Assistant
        </Link>
        <span className="text-[10px] text-[#646e87] hidden sm:inline">/</span>
        <span className="text-[12px] font-medium text-[#F8FAFC] tracking-tight truncate">
          {getSectionLabel()}
        </span>
        {userProfile.targetRole && (
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[180px]">
            Target: {userProfile.targetRole}
          </span>
        )}
      </div>

      {/* Right: Actions, Status Dot & Profile Icon */}
      <div className="flex items-center gap-2.5">
        {actions}

        {/* Re-upload Quick Action Button */}
        <Link
          href="/onboarding"
          aria-label="Re-upload resume"
          className="hidden sm:inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-[#1f2433] bg-[#151621]/60 text-[11px] text-[#94A3B8] hover:text-white hover:border-[#3B465C] transition-all"
        >
          <FileUp size={11} className="text-indigo-400" />
          <span>Upload</span>
        </Link>

        {/* Engine Operational Status */}
        <Link
          href="/status"
          aria-label="View system status"
          className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-white/[0.04] bg-[#0f101a]/40 text-[10px] text-[#86EFAC] hover:bg-[#151621] transition-all"
        >
          <StatusDot variant="success" label="Online" />
          <span className="hidden md:inline font-mono">Ready</span>
        </Link>

        {/* Profile Avatar Button & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="User Profile Menu"
            aria-expanded={dropdownOpen}
            className="flex items-center gap-1.5 h-7 pl-1 pr-1.5 rounded-full border border-[#1f2433] bg-[#151621] hover:border-indigo-500/50 hover:bg-[#1a1c2c] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
          >
            {/* Circular Avatar */}
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 text-[10px] font-semibold text-white shadow-sm">
              AM
              {/* Online Green Ping */}
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-1 ring-[#151621]" />
            </div>

            <ChevronDown
              size={11}
              className={`text-[#646e87] transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Floating Transparent Profile Dropdown */}
          {dropdownOpen && (
            <div
              role="menu"
              aria-label="Profile actions"
              className="absolute right-0 top-9 w-60 rounded-xl border border-[#1f2433] bg-[#151621]/95 p-2 shadow-2xl shadow-black/90 backdrop-blur-xl animate-fade-in-up"
              style={{
                boxShadow:
                  'rgba(255, 255, 255, 0.05) 0px 1px 1px 0px inset, 0 15px 35px -5px rgba(0, 0, 0, 0.8)',
              }}
            >
              {/* User Profile Header */}
              <div className="flex items-center gap-2.5 px-2.5 py-2 border-b border-[#1f2433]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-inner">
                  AM
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {userProfile.name}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] truncate">
                    {userProfile.email}
                  </span>
                  <span className="text-[9px] text-indigo-400 font-mono mt-0.5">
                    {userProfile.currentRole}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#c9d3ee] hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <LayoutDashboard size={13} className="text-[#94A3B8]" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/dashboard/explore"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#c9d3ee] hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <Compass size={13} className="text-[#94A3B8]" />
                  <span>Explore Paths</span>
                </Link>

                <Link
                  href="/dashboard/track"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#c9d3ee] hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <ListTodo size={13} className="text-[#94A3B8]" />
                  <span>Track Execution</span>
                </Link>

                <Link
                  href="/dashboard/experience"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#c9d3ee] hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <CheckSquare size={13} className="text-[#94A3B8]" />
                  <span>Edit Experience</span>
                </Link>
              </div>

              {/* System & Sign Out */}
              <div className="pt-1 border-t border-[#1f2433]">
                <Link
                  href="/status"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>System Diagnostics</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default InternalNavbar;
