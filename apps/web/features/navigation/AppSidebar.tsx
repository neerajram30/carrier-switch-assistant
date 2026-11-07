'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CheckSquare, Compass, Home, ListTodo, ShieldCheck } from 'lucide-react';
import { StatusDot } from '@astryxdesign/core/StatusDot';

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
    href: '/dashboard',
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
    label: 'Edit Experience',
    href: '/dashboard/experience',
    shortcut: '4',
    icon: <CheckSquare size={16} aria-hidden="true" />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Keyboard shortcut listener (1: Dashboard, 2: Explore Paths, 3: Edit Experience)
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

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
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
        overflowY: 'auto',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Brand Header */}
        <Link
          href="/dashboard"
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

        {/* Navigation Items (Home and Review & Edit only) */}
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
          paddingTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            borderRadius: 8,
            background: 'var(--color-carbon-surface, #151621)',
            border: '1px solid var(--color-gunmetal, #1f2433)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <StatusDot variant="success" label="Active" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--color-text-green, #86EFAC)',
              }}
            >
              Engine Online
            </span>
          </div>

          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--color-muted-steel, #646e87)',
            }}
          >
            v0.1
          </span>
        </div>

        {/* Advisory Privacy Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            fontSize: '0.72rem',
            color: 'var(--color-muted-steel, #646e87)',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
          <span>Private &amp; Advisory Only</span>
        </div>
      </div>
    </aside>
  );
}
