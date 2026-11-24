'use client';

import React, { useEffect, useRef } from 'react';

interface ScrollRevealProviderProps {
  children: React.ReactNode;
}

/**
 * ScrollRevealProvider observes all child elements with `.reveal-init`
 * using IntersectionObserver and toggles `.reveal-active` with GPU-accelerated
 * staggered transitions when scrolled into view.
 * Also renders a zero-overhead top scroll progress indicator.
 * Fully respects `prefers-reduced-motion` for accessibility.
 */
export function ScrollRevealProvider({ children }: ScrollRevealProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Passive GPU-accelerated scroll progress bar
    let ticking = false;
    const updateProgress = () => {
      if (!progressBarRef.current) return;
      const scrollY = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      progressBarRef.current.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    // 2. Reduced motion check
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const elements = containerRef.current?.querySelectorAll('.reveal-init');
      elements?.forEach((el) => el.classList.add('reveal-active'));
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }

    if (typeof IntersectionObserver === 'undefined') {
      const elements = containerRef.current?.querySelectorAll('.reveal-init');
      elements?.forEach((el) => el.classList.add('reveal-active'));
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }

    // 3. Staggered reveal observer
    let staggerTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingQueue: Element[] = [];

    const flushQueue = () => {
      pendingQueue.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('reveal-active');
        }, index * 70); // Gentle 70ms cascade
      });
      pendingQueue = [];
      staggerTimeout = null;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pendingQueue.push(entry.target);
            observer.unobserve(entry.target);
          }
        });

        if (pendingQueue.length > 0) {
          if (staggerTimeout) clearTimeout(staggerTimeout);
          staggerTimeout = setTimeout(flushQueue, 20);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const elements = containerRef.current?.querySelectorAll('.reveal-init');
    elements?.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (staggerTimeout) clearTimeout(staggerTimeout);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Zero-overhead 2px gradient progress bar */}
      <div
        ref={progressBarRef}
        className="scroll-progress-bar"
        aria-hidden="true"
      />
      <div ref={containerRef}>{children}</div>
    </>
  );
}
