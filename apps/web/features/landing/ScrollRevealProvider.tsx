'use client';

import React, { useEffect, useRef } from 'react';

interface ScrollRevealProviderProps {
  children: React.ReactNode;
}

interface ParallaxItem {
  element: HTMLElement;
  speed: number;
  limit: number;
  axis: 'y' | 'x';
  initialTop: number;
  height: number;
  isHero: boolean;
}

/**
 * ScrollRevealProvider observes all child elements with `.reveal-init`
 * using IntersectionObserver and toggles `.reveal-active` with GPU-accelerated
 * staggered transitions when scrolled into view.
 * Also renders a zero-overhead top scroll progress indicator.
 * Provides a high-performance 60fps/120fps GPU parallax engine for [data-parallax] elements.
 * Fully respects `prefers-reduced-motion` for accessibility.
 */
export function ScrollRevealProvider({ children }: ScrollRevealProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Passive GPU-accelerated scroll progress bar
    let ticking = false;

    // 2. Discover and cache parallax elements
    let parallaxItems: ParallaxItem[] = [];

    const measureParallax = () => {
      if (prefersReducedMotion || !containerRef.current) return;
      const elements = containerRef.current.querySelectorAll<HTMLElement>('[data-parallax]');
      const scrollY = window.scrollY || 0;

      parallaxItems = Array.from(elements).map((el) => {
        const rect = el.getBoundingClientRect();
        const top = rect.top + scrollY;
        const speed = parseFloat(el.dataset.parallax || '0');
        const limit = parseFloat(el.dataset.parallaxLimit || '120');
        const axis = (el.dataset.parallaxAxis as 'y' | 'x') || 'y';
        const isHero = top < (window.innerHeight || 800);

        el.style.willChange = 'transform';

        return {
          element: el,
          speed,
          limit,
          axis,
          initialTop: top,
          height: rect.height,
          isHero,
        };
      });
    };

    const updateTransforms = () => {
      const scrollY = window.scrollY || 0;
      const innerHeight = window.innerHeight || 800;

      // 1. Progress Bar
      if (progressBarRef.current) {
        const docHeight =
          (document.documentElement.scrollHeight || 1000) - innerHeight;
        const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }

      // 2. Parallax calculations
      if (!prefersReducedMotion && parallaxItems.length > 0) {
        const viewportCenter = scrollY + innerHeight * 0.5;

        for (let i = 0; i < parallaxItems.length; i++) {
          const item = parallaxItems[i];
          let rawOffset = 0;

          if (item.isHero) {
            // For elements in the hero section at the top of the page,
            // direct proportional movement with scroll depth provides an intuitive 3D feel
            rawOffset = scrollY * item.speed;
          } else {
            // For elements further down the page, calculate relative to viewport center
            const elementCenter = item.initialTop + item.height * 0.5;
            const distFromCenter = viewportCenter - elementCenter;
            rawOffset = distFromCenter * item.speed;
          }

          // Clamp to limit to prevent elements drifting out of layout bounds
          const clamped = Math.max(-item.limit, Math.min(item.limit, rawOffset));

          if (item.axis === 'x') {
            item.element.style.transform = `translate3d(${clamped.toFixed(1)}px, 0, 0)`;
          } else {
            item.element.style.transform = `translate3d(0, ${clamped.toFixed(1)}px, 0)`;
          }
        }
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateTransforms);
        ticking = true;
      }
    };

    const handleResize = () => {
      measureParallax();
      handleScroll();
    };

    measureParallax();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    updateTransforms();

    // 3. Staggered reveal observer
    let staggerTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingQueue: Element[] = [];

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      const elements = containerRef.current?.querySelectorAll('.reveal-init');
      elements?.forEach((el) => el.classList.add('reveal-active'));
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }

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
      window.removeEventListener('resize', handleResize);
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
