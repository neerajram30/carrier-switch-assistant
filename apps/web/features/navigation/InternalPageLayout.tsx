'use client';

import React from 'react';
import { InternalNavbar } from './InternalNavbar';
import {
  InternalPageHeader,
  type InternalPageHeaderProps,
} from './InternalPageHeader';

export interface InternalPageLayoutProps extends Omit<InternalPageHeaderProps, 'style'> {
  children: React.ReactNode;
  /**
   * If true, layout uses 100% height and zero overflow (ideal for full-screen canvases like Explore Paths).
   * If false, allows natural vertical scrolling for structured dashboard cards and forms.
   */
  fullHeight?: boolean;
  /**
   * Maximum width of the inner content container.
   * Defaults to '100%' for edge-to-edge layout with uniform compact gutter padding.
   */
  maxWidth?: number | string;
  /**
   * Outer container inline styles override.
   */
  containerStyle?: React.CSSProperties;
  /**
   * Content container inline styles override.
   */
  contentStyle?: React.CSSProperties;
  /**
   * Whether to show the top header section. Defaults to false.
   */
  showHeader?: boolean;
  /**
   * Whether to show the compact transparent navbar with profile icon. Defaults to true.
   */
  showNavbar?: boolean;
}

/**
 * Reusable layout for internal pages.
 * Designed with zero horizontal waste, featuring a compact transparent navbar with profile icon.
 */
export function InternalPageLayout({
  badge,
  badgeIcon,
  badgeSecondaryText,
  title,
  description,
  current,
  actions,
  padding,
  children,
  fullHeight = false,
  maxWidth = '100%',
  containerStyle,
  contentStyle,
  showHeader = false,
  showNavbar = true,
}: InternalPageLayoutProps) {
  if (fullHeight) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          overflow: 'hidden',
          background: 'var(--color-void-black, #0f101a)',
          color: 'var(--color-pure-white, #ffffff)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          ...containerStyle,
        }}
      >
        {showNavbar && <InternalNavbar title={title} current={current} />}

        {showHeader && (
          <InternalPageHeader
            badge={badge}
            badgeIcon={badgeIcon}
            badgeSecondaryText={badgeSecondaryText}
            title={title}
            description={description}
            current={current}
            actions={actions}
            padding="8px 16px"
          />
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '12px 16px',
            boxSizing: 'border-box',
            ...contentStyle,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: 'var(--color-void-black, #0f101a)',
        color: 'var(--color-pure-white, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...containerStyle,
      }}
    >
      {showNavbar && <InternalNavbar title={title} current={current} />}

      {showHeader && (
        <InternalPageHeader
          badge={badge}
          badgeIcon={badgeIcon}
          badgeSecondaryText={badgeSecondaryText}
          title={title}
          description={description}
          current={current}
          actions={actions}
          padding={padding ?? '16px 20px 8px 20px'}
        />
      )}

      {/* Main Content Area - Full width edge-to-edge */}
      <main
        style={{
          width: '100%',
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: 0,
          padding: '16px 20px 48px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          ...contentStyle,
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default InternalPageLayout;
