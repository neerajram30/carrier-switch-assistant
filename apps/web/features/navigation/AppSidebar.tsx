'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ArrowUpCircle,
  Check,
  ChevronDown,
  Compass,
  Home,
  ListTodo,
  LogOut,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  shortcut: string;
  icon: React.ReactNode;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    shortcut: '1',
    icon: <Home size={16} aria-hidden="true" />,
  },
  {
    id: 'explore',
    label: 'Explore Paths',
    href: '/dashboard/explore',
    shortcut: '2',
    icon: <Compass size={16} aria-hidden="true" />,
  },
  {
    id: 'track',
    label: 'Track',
    href: '/dashboard/track',
    shortcut: '3',
    icon: <ListTodo size={16} aria-hidden="true" />,
  },
  {
    id: 'review',
    label: 'Profile',
    href: '/dashboard/experience',
    shortcut: '4',
    icon: <User size={16} aria-hidden="true" />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Profile data state with safe lazy client initialization
  const [userProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('csa_career_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            return {
              name: 'Alex Morgan',
              email: 'dev-user@example.com',
              currentRole: parsed.currentRole || 'Frontend Developer',
              targetRole: parsed.targetRole || '',
            };
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return {
      name: 'Alex Morgan',
      email: 'dev-user@example.com',
      currentRole: 'Frontend Developer',
      targetRole: '',
    };
  });

  const displayName = session?.user?.name || userProfile.name;
  const displayEmail = session?.user?.email || userProfile.email;
  const displayImage = session?.user?.image || null;
  const firstInitial = (displayName || 'Alex Morgan').trim().charAt(0).toUpperCase() || 'A';

  // Keyboard shortcut listener (1: Dashboard, 2: Explore Paths, 3: Track, 4: Edit Experience)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const match = MAIN_NAV_ITEMS.find((item) => item.shortcut === e.key);
      if (match) {
        router.push(match.href);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Click outside and Escape key to close user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    try {
      localStorage.removeItem('csa_auth_token');
      localStorage.removeItem('csa_user_id');
      localStorage.removeItem('career_switch_user_profile');
      sessionStorage.removeItem('csa_career_profile');
    } catch {
      // ignore
    }
    try {
      await signOut({ redirect: false });
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard' || href === '/') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (href === '/dashboard/explore') {
      return pathname.startsWith('/dashboard/explore') || pathname.startsWith('/explore');
    }
    if (href === '/dashboard/track') {
      return (
        pathname.startsWith('/dashboard/track') || pathname.startsWith('/track')
      );
    }
    if (href === '/dashboard/experience') {
      return (
        pathname.startsWith('/dashboard/experience') ||
        pathname.startsWith('/dashboard/edit-experience')
      );
    }
    return pathname === href;
  };

  return (
    <aside
      aria-label="Application sidebar"
      style={{
        width: 250,
        minWidth: 250,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--color-void-black, #0f101a)',
        borderRight: '1px solid var(--color-gunmetal, #1f2433)',
        boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px 16px 14px',
        boxSizing: 'border-box',
        overflowY: 'visible',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Brand Header */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'block',
            padding: '4px 8px 14px 8px',
          }}
        >
          <div
            style={{
              fontFamily:
                'var(--font-helvetica-now-display, "Helvetica Now Display", "Inter", sans-serif)',
              fontSize: '1.28rem',
              fontWeight: 500,
              color: 'var(--color-pure-white, #ffffff)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Career Switch
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              color: 'var(--color-muted-steel, #646e87)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Assistant Flight Deck
          </div>
        </Link>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href);
            const hovered = hoveredId === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 10,
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: active
                    ? 'var(--color-pure-white, #ffffff)'
                    : hovered
                      ? 'var(--color-frost, #c9d3ee)'
                      : 'var(--color-muted-steel, #646e87)',
                  background: active
                    ? 'var(--color-carbon-surface, #151621)'
                    : hovered
                      ? 'rgba(21, 22, 33, 0.7)'
                      : 'transparent',
                  border: active
                    ? '1px solid var(--color-gunmetal, #1f2433)'
                    : '1px solid transparent',
                  boxShadow: active
                    ? 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)'
                    : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      color: active
                        ? 'var(--color-periwinkle-glow, #98a4f7)'
                        : 'var(--color-muted-steel, #646e87)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {/* Keyboard Shortcut Indicator */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    color: active
                      ? 'var(--color-pure-white, #ffffff)'
                      : 'var(--color-muted-steel, #646e87)',
                    background: 'var(--color-void-black, #0f101a)',
                    border: '1px solid var(--color-gunmetal, #1f2433)',
                  }}
                >
                  {item.shortcut}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div
        style={{
          borderTop: '1px solid var(--color-gunmetal, #1f2433)',
          paddingTop: 8,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* User Details Section (Notion-style Bottom Bar) */}
        <div
          ref={userMenuRef}
          style={{
            position: 'relative',
          }}
        >
          {/* User Button Trigger */}
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-label="User Profile Menu"
            aria-expanded={userMenuOpen}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 8,
              background: userMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-white/[0.05]"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              {/* Square avatar with letter initial */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  background: '#242738',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-frost, #c9d3ee)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImage}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  firstInitial
                )}
              </div>

              {/* User display name */}
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: 'var(--color-frost, #c9d3ee)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 130,
                }}
              >
                {displayName}
              </span>

              {/* Chevron */}
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--color-muted-steel, #646e87)',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0,
                }}
              />
            </div>
          </button>

          {/* Notion-style Popover Menu */}
          {userMenuOpen && (
            <div
              role="menu"
              aria-label="User Profile Details"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: '#151621',
                border: '1px solid var(--color-gunmetal, #1f2433)',
                borderRadius: 12,
                padding: '8px',
                boxShadow:
                  '0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 1px 1px 0 rgba(255, 255, 255, 0.05) inset',
                zIndex: 100,
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Header: Avatar, Workspace Title & Plan */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 8px 10px 8px',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#242738',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {displayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayImage}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    firstInitial
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}&apos;s Workspace
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#94a3b8',
                    }}
                  >
                    {userProfile.currentRole ? `${userProfile.currentRole} · Free Plan` : 'Free Plan · 1 member'}
                  </span>
                </div>
              </div>

              {/* Actions Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link
                  href="/dashboard/explore"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: 'var(--color-periwinkle-glow, #98a4f7)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  className="hover:bg-white/[0.05]"
                >
                  <ArrowUpCircle size={14} />
                  <span>Upgrade</span>
                </Link>

                <Link
                  href="/dashboard/experience"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: 'var(--color-frost, #c9d3ee)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  className="hover:bg-white/[0.05]"
                >
                  <Settings size={14} style={{ color: '#94a3b8' }} />
                  <span>Settings</span>
                </Link>

                <Link
                  href="/status"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: 'var(--color-frost, #c9d3ee)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  className="hover:bg-white/[0.05]"
                >
                  <ShieldCheck size={14} style={{ color: '#86efac' }} />
                  <span>System Diagnostics</span>
                </Link>
              </div>

              {/* Workspace / Account Section */}
              <div
                style={{
                  borderTop: '1px solid var(--color-gunmetal, #1f2433)',
                  marginTop: 6,
                  paddingTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {/* Email line with More options icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    color: 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayEmail}
                  </span>
                  <MoreHorizontal size={13} style={{ flexShrink: 0 }} />
                </div>

                {/* Active workspace row with Checkmark */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: '#242738',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'var(--color-frost, #c9d3ee)',
                        flexShrink: 0,
                      }}
                    >
                      {firstInitial}
                    </div>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                      }}
                    >
                      {displayName}&apos;s Workspace
                    </span>
                  </div>
                  <Check size={13} style={{ color: '#ffffff', flexShrink: 0 }} />
                </div>
              </div>

              {/* Log out Action */}
              <div
                style={{
                  borderTop: '1px solid var(--color-gunmetal, #1f2433)',
                  marginTop: 6,
                  paddingTop: 6,
                }}
              >
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.78rem',
                    color: '#f87171',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  className="hover:bg-rose-500/10"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
