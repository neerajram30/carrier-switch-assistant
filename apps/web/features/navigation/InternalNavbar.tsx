"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
   * Additional actions or controls (kept for API compatibility; navbar only contains breadcrumb).
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
  style,
}: InternalNavbarProps) {
  const pathname = usePathname();

  // Target role for breadcrumb if available
  const targetRole = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      try {
        const stored = sessionStorage.getItem("csa_career_profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object" && typeof parsed.targetRole === "string") {
            return parsed.targetRole;
          }
        }
      } catch {
        // Fallback
      }
      return "";
    },
    () => "",
  );

  // Infer section label if title is not explicitly provided
  const getSectionLabel = () => {
    if (title) return title;
    if (current === "explore" || pathname?.includes("/explore"))
      return "Explore Paths";
    if (current === "track" || pathname?.includes("/track"))
      return "Track Execution";
    if (
      current === "experience" ||
      pathname?.includes("/experience")
    )
      return "Profile";
    return "Dashboard Overview";
  };

  return (
    <header
      data-testid="internal-navbar"
      className="relative z-30 w-full select-none"
      style={{
        height: 42,
        maxHeight: 42,
        minHeight: 42,
        background: "rgba(15, 16, 26, 0.45)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0 16px",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Breadcrumb Only */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0">
        <Link
          href="/"
          className="text-[11px] font-medium text-[#646e87] hover:text-[#c9d3ee] transition-colors truncate hidden sm:inline"
        >
          Career Switch Assistant
        </Link>
        <span className="text-[10px] text-[#646e87] hidden sm:inline">/</span>
        <span className="text-[12px] font-medium text-[#F8FAFC] tracking-tight truncate">
          {getSectionLabel()}
        </span>
        {targetRole && (
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[180px]">
            Target: {targetRole}
          </span>
        )}
      </nav>
    </header>
  );
}

export default InternalNavbar;
