'use client';

import React, { useEffect, useRef } from 'react';

interface ScrollRevealProviderProps {
  children: React.ReactNode;
}

/**
 * ScrollRevealProvider observes all child elements with `.reveal-init`
 * using IntersectionObserver and toggles `.reveal-active` when scrolled into view.
 * Respects `prefers-reduced-motion` for accessibility.
 */
export function ScrollRevealProvider({ children }: ScrollRevealProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user prefers reduced motion, reveal everything immediately
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const elements = containerRef.current?.querySelectorAll('.reveal-init');
      elements?.forEach((el) => el.classList.add('reveal-active'));
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      const elements = containerRef.current?.querySelectorAll('.reveal-init');
      elements?.forEach((el) => el.classList.add('reveal-active'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            // Unobserve once revealed so animation persists cleanly
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = containerRef.current?.querySelectorAll('.reveal-init');
    elements?.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
