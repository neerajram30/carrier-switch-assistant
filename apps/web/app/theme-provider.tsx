"use client";

import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "../theme/neutralTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={neutralTheme} mode="dark">
      {children}
    </Theme>
  );
}
