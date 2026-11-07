'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Compass, Upload } from 'lucide-react';

export type InternalPageKey = 'dashboard' | 'explore' | 'experience' | 'track';

export interface InternalPageActionsProps {
  current?: InternalPageKey;
  extraActions?: React.ReactNode;
}

/**
 * Clean, consistent navigation action buttons for internal pages.
 * Rendered directly without requiring a boxed or dedicated navbar bar.
 */
export function InternalPageActions({
  current,
  extraActions,
}: InternalPageActionsProps) {
  const router = useRouter();

  return (
    <HStack gap={3} align="center">
      {extraActions}

      {/* Return to Dashboard button (if not currently on dashboard) */}
      {current && current !== 'dashboard' && (
        <Button
          label="← Return to Dashboard"
          variant="secondary"
          size="sm"
          onClick={() => router.push('/dashboard')}
        />
      )}

      {/* Re-upload Resume button (on dashboard) */}
      {current === 'dashboard' && (
        <Link href="/onboarding" style={{ textDecoration: 'none' }}>
          <button
            type="button"
            id="reupload-resume-btn"
            onClick={() => router.push('/onboarding')}
            style={{
              background: 'rgba(21, 22, 33, 0.85)',
              color: 'var(--color-frost, #c9d3ee)',
              border: '1px solid var(--color-gunmetal, #1f2433)',
              borderRadius: 9999,
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={13} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
            <span>Re-upload Resume</span>
          </button>
        </Link>
      )}

      {/* Explore Paths button (if not currently on explore) */}
      {current !== 'explore' && (
        <Link href="/dashboard/explore" style={{ textDecoration: 'none' }}>
          <button
            type="button"
            style={{
              background:
                'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 9999,
              padding: '6px 16px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow:
                'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
              transition: 'opacity 0.15s ease',
            }}
          >
            <Compass size={14} />
            <span>Explore Paths</span>
          </button>
        </Link>
      )}

      {/* Track Roadmap button (if not currently on track) */}
      {current !== 'track' && (
        <Link href="/dashboard/track" style={{ textDecoration: 'none' }}>
          <Button
            label="Track Roadmap"
            variant="secondary"
            size="sm"
          />
        </Link>
      )}

      {/* Edit Experience button (if not currently on experience) */}
      {current !== 'experience' && (
        <Link href="/dashboard/experience" style={{ textDecoration: 'none' }}>
          <Button
            label="Edit Experience"
            variant="secondary"
            size="sm"
          />
        </Link>
      )}
    </HStack>
  );
}

export interface InternalPageHeaderProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  badgeSecondaryText?: string;
  title: string;
  description?: string;
  current?: InternalPageKey;
  actions?: React.ReactNode;
  padding?: string | number;
  style?: React.CSSProperties;
}

/**
 * Reusable, seamless header for internal pages without a boxed or dedicated navbar.
 * Renders page title, badge, and navigation action buttons directly on the background.
 */
export function InternalPageHeader({
  badge,
  badgeIcon,
  badgeSecondaryText,
  title,
  description,
  current,
  actions,
  padding = '16px 28px 12px 28px',
  style,
}: InternalPageHeaderProps) {
  return (
    <header
      style={{
        flexShrink: 0,
        width: '100%',
        padding,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'transparent',
        border: 'none',
        ...style,
      }}
    >
      {/* Title & Badge Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(badge || badgeSecondaryText) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {badge && (
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(91, 99, 211, 0.18)',
                  border: '1px solid var(--color-periwinkle-glow, #98a4f7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-periwinkle-glow, #98a4f7)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {badgeIcon}
                <span>{badge}</span>
              </div>
            )}
            {badgeSecondaryText && (
              <span
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--color-muted-steel, #646e87)',
                }}
              >
                {badgeSecondaryText}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <Heading level={1} weight="semibold" style={{ fontSize: '1.3rem', margin: 0 }}>
            {title}
          </Heading>
          {description && (
            <Text
              type="supporting"
              color="secondary"
              style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}
            >
              {description}
            </Text>
          )}
        </div>
      </div>

      {/* Buttons (seamlessly positioned without a dedicated navbar bar) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {actions ? actions : <InternalPageActions current={current} />}
      </div>
    </header>
  );
}

export default InternalPageHeader;
