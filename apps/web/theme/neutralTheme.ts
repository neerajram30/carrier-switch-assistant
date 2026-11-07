import {
  defineTheme,
  defineSyntaxTheme,
  type TokenValue,
} from '@astryxdesign/core/theme';
import {neutralIconRegistry} from './icons';
import {neutralPaletteRefs} from './neutralPaletteRefs.generated';

const {blue, green, neutral, orange, purple, red, teal, yellow} =
  neutralPaletteRefs;
const withAlpha = (color: string, alpha: string) => `${color}${alpha}`;

const neutralSyntax = defineSyntaxTheme({
  name: 'astryx-neutral',
  tokens: {
    keyword: [purple.light[30], purple.light[80]],
    string: [green.light[30], green.light[80]],
    comment: [neutral.light[45], neutral.dark[65]],
    number: [orange.light[30], orange.dark[80]],
    function: [blue.light[30], blue.dark[80]],
    type: [purple.light[30], purple.light[80]],
    variable: [neutral.light[5], neutral.dark[90]],
    operator: [neutral.light[45], neutral.dark[65]],
    constant: [orange.light[30], orange.dark[80]],
    tag: [red.light[30], red.dark[80]],
    attribute: [yellow.light[30], yellow.light[80]],
    property: [teal.light[30], teal.light[80]],
    punctuation: [neutral.light[45], neutral.dark[65]],
    background: [neutral.light[100], neutral.dark[5]],
  },
});

// Semantic status fill colors based on user specification:
// Primary (Indigo/Blue) -> User actions, Navigation, Focus
// AI (Cyan) -> AI insights, AI analysis, AI-generated
// Green -> Success
// Amber -> Warning
// Red -> Error
// Blue -> Information
const neutralLocalTokens: Record<string, TokenValue> = {
  // Midnight SRE Tokens from Design.md
  '--color-void-black': ['#0f101a', '#0f101a'],
  '--color-carbon-surface': ['#151621', '#151621'],
  '--color-gunmetal': ['#1f2433', '#1f2433'],
  '--color-steel-border': ['#939db8', '#939db8'],
  '--color-muted-steel': ['#646e87', '#646e87'],
  '--color-frost': ['#c9d3ee', '#c9d3ee'],
  '--color-pure-white': ['#ffffff', '#ffffff'],
  '--color-iris-blue': ['#5b63d3', '#5b63d3'],
  '--color-periwinkle-glow': ['#98a4f7', '#98a4f7'],
  '--shadow-subtle': [
    'rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset',
    'rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset',
  ],

  // Primary (Iris Blue / Periwinkle Glow) for action/navigation/focus
  '--astryx-theme-neutral-color-status-fill-accent': ['#5B63D3', '#5B63D3'],
  // AI (Cyan)
  '--astryx-theme-neutral-color-status-fill-ai': ['#0891B2', '#06B6D4'],
  // Status Green -> Success
  '--astryx-theme-neutral-color-status-fill-success': ['#16A34A', '#22C55E'],
  // Amber -> Warning
  '--astryx-theme-neutral-color-status-fill-warning': ['#D97706', '#F59E0B'],
  // Red -> Error
  '--astryx-theme-neutral-color-status-fill-error': ['#DC2626', '#EF4444'],
  // Blue -> Information
  '--astryx-theme-neutral-color-status-fill-info': ['#2563EB', '#3B82F6'],

  // AI Semantic Custom Tokens (Cyan)
  '--color-ai': ['#0891B2', '#06B6D4'],
  '--color-ai-muted': ['#0891B222', '#06B6D433'],
  '--color-text-ai': ['#0E7490', '#67E8F9'],
  '--color-border-ai': ['#0891B2', '#22D3EE'],
  '--color-icon-ai': ['#0891B2', '#22D3EE'],

  '--astryx-theme-neutral-color-status-muted-accent': ['#5B63D322', '#98A4F733'],
  '--astryx-theme-neutral-color-on-tint-neutral': ['#fafafa4D', '#0a0a0a4D'],
  '--astryx-theme-neutral-color-on-tint-overlay-hover': [
    '#fafafa1A',
    '#0a0a0a1A',
  ],
  '--astryx-theme-neutral-color-on-tint-overlay-pressed': [
    '#fafafa33',
    '#0a0a0a33',
  ],
  '--astryx-theme-neutral-color-destructive-overlay-hover': [
    '#DC26261A',
    '#EF44441A',
  ],
  '--astryx-theme-neutral-color-destructive-overlay-pressed': [
    '#DC262633',
    '#EF444433',
  ],
};

const statusFill = {
  accent: 'var(--astryx-theme-neutral-color-status-fill-accent)',
  ai: 'var(--astryx-theme-neutral-color-status-fill-ai)',
  success: 'var(--astryx-theme-neutral-color-status-fill-success)',
  warning: 'var(--astryx-theme-neutral-color-status-fill-warning)',
  error: 'var(--astryx-theme-neutral-color-status-fill-error)',
  info: 'var(--astryx-theme-neutral-color-status-fill-info)',
} as const;

export const neutralTheme = defineTheme({
  name: 'neutral',
  localTokens: neutralLocalTokens,

  typography: {
    scale: {base: 14, ratio: 1.2},
    body: {
      family: 'Helvetica Now Text',
      fallbacks:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'Helvetica Now Display',
      fallbacks:
        '"Inter Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      weights: {3: 'medium', 4: 'medium'},
    },
    code: {
      family: 'ui-monospace',
      fallbacks:
        '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },

  motion: {fast: 125, medium: 300, slow: 700, ratio: 0.75},
  syntax: neutralSyntax,

  tokens: {
    // =========================================================================
    // MIDNIGHT SRE CONSOLE - Canvas, Surfaces, and Structure (Design.md)
    // =========================================================================
    '--color-background-surface': ['#FFFFFF', '#151621'], // Carbon Surface
    '--color-background-body': ['#F8FAFC', '#0f101a'],    // Void Black
    '--color-background-card': ['#FFFFFF', '#151621'],    // Carbon Surface
    '--color-background-popover': ['#FFFFFF', '#151621'], // Carbon Surface
    '--color-background-muted': ['#F1F5F9', '#1f2433'],   // Gunmetal

    // =========================================================================
    // PRIMARY (Iris Blue & Periwinkle Glow) - User actions & Links (Design.md)
    // =========================================================================
    '--color-accent': ['#4F46E5', '#5B63D3'],              // Iris Blue
    '--color-accent-muted': ['#4F46E522', '#98A4F726'],    // Periwinkle Glow tint
    '--color-text-accent': ['#4338CA', '#98A4F7'],         // Periwinkle Glow
    '--color-icon-accent': ['#4F46E5', '#98A4F7'],
    '--color-on-accent': '#FFFFFF',

    '--color-neutral': [
      withAlpha(neutral.light[0], '0F'),
      withAlpha(neutral.dark[100], '1A'),
    ],

    // Overlays
    '--color-overlay': [
      withAlpha(neutral.light[0], '80'),
      withAlpha(neutral.dark[0], 'CC'),
    ],
    '--color-overlay-hover': [
      withAlpha(neutral.light[0], '0D'),
      withAlpha(neutral.dark[100], '0D'),
    ],
    '--color-overlay-pressed': [
      withAlpha(neutral.light[0], '1A'),
      withAlpha(neutral.dark[100], '1A'),
    ],

    // Text & Icons (Design.md: Pure White, Frost, Muted Steel)
    '--color-text-primary': ['#0F172A', '#ffffff'],         // Pure White
    '--color-text-secondary': ['#475569', '#c9d3ee'],       // Frost
    '--color-text-disabled': ['#94A3B8', '#646e87'],        // Muted Steel
    '--color-on-dark': '#FFFFFF',
    '--color-on-light': '#0F172A',

    '--color-icon-primary': ['#0F172A', '#ffffff'],
    '--color-icon-secondary': ['#64748B', '#c9d3ee'],
    '--color-icon-disabled': ['#94A3B8', '#646e87'],

    // Borders (Design.md: Gunmetal for subtle/inputs, Steel Border for hairline)
    '--color-border': ['#E2E8F0', '#1f2433'],               // Gunmetal
    '--color-border-emphasized': ['#CBD5E1', '#939db8'],    // Steel Border

    // =========================================================================
    // STATUS: Green -> Success
    // =========================================================================
    '--color-success': ['#16A34A', '#22C55E'],
    '--color-success-muted': ['#16A34A22', '#22C55E33'],
    '--color-on-success': '#FFFFFF',
    '--color-background-green': ['#16A34A22', '#22C55E2E'],
    '--color-border-green': ['#16A34A', '#22C55E'],
    '--color-icon-green': ['#16A34A', '#4ADE80'],
    '--color-text-green': ['#15803D', '#86EFAC'],

    // =========================================================================
    // STATUS: Amber -> Warning
    // =========================================================================
    '--color-warning': ['#D97706', '#F59E0B'],
    '--color-warning-muted': ['#D9770622', '#F59E0B33'],
    '--color-on-warning': '#0F172A',
    '--color-background-yellow': ['#D9770622', '#F59E0B2E'],
    '--color-border-yellow': ['#D97706', '#F59E0B'],
    '--color-icon-yellow': ['#D97706', '#FCD34D'],
    '--color-text-yellow': ['#B45309', '#FDE68A'],

    // =========================================================================
    // STATUS: Red -> Error
    // =========================================================================
    '--color-error': ['#DC2626', '#EF4444'],
    '--color-error-muted': ['#DC262622', '#EF444433'],
    '--color-on-error': '#FFFFFF',
    '--color-background-red': ['#DC262622', '#EF44442E'],
    '--color-border-red': ['#DC2626', '#EF4444'],
    '--color-icon-red': ['#DC2626', '#F87171'],
    '--color-text-red': ['#B91C1C', '#FCA5A5'],

    // =========================================================================
    // STATUS: Blue -> Information
    // =========================================================================
    '--color-background-blue': ['#2563EB22', '#3B82F62E'],
    '--color-border-blue': ['#2563EB', '#3B82F6'],
    '--color-icon-blue': ['#2563EB', '#60A5FA'],
    '--color-text-blue': ['#1D4ED8', '#93C5FD'],

    // =========================================================================
    // AI: Cyan -> AI insights, AI analysis, AI-generated
    // =========================================================================
    '--color-background-cyan': ['#0891B222', '#06B6D42E'],
    '--color-border-cyan': ['#0891B2', '#0891B2'],
    '--color-icon-cyan': ['#0891B2', '#22D3EE'],
    '--color-text-cyan': ['#0E7490', '#67E8F9'],

    // Orange, Pink, Purple, Teal, Gray palettes
    '--color-background-orange': ['#EA580C22', '#F973162E'],
    '--color-border-orange': ['#EA580C', '#FB923C'],
    '--color-icon-orange': ['#EA580C', '#FB923C'],
    '--color-text-orange': ['#C2410C', '#FDBA74'],

    '--color-background-pink': ['#DB277722', '#EC48992E'],
    '--color-border-pink': ['#DB2777', '#F472B6'],
    '--color-icon-pink': ['#DB2777', '#F472B6'],
    '--color-text-pink': ['#BE185D', '#F9A8D4'],

    '--color-background-purple': ['#7C3AED22', '#8B5CF62E'],
    '--color-border-purple': ['#7C3AED', '#A78BFA'],
    '--color-icon-purple': ['#7C3AED', '#A78BFA'],
    '--color-text-purple': ['#6D28D9', '#C4B5FD'],

    '--color-background-teal': ['#0D948822', '#14B8A62E'],
    '--color-border-teal': ['#0D9488', '#2DD4BF'],
    '--color-icon-teal': ['#0D9488', '#2DD4BF'],
    '--color-text-teal': ['#0F766E', '#5EEAD4'],

    '--color-background-gray': ['#F1F5F9', '#1E232F'],
    '--color-border-gray': ['#E2E8F0', '#334155'],
    '--color-icon-gray': ['#64748B', '#94A3B8'],
    '--color-text-gray': ['#334155', '#E2E8F0'],

    // Radius (Design.md: 10px nav/inputs, 16px cards, 9999px buttons)
    '--radius-none': '0px',
    '--radius-inner': '10px',
    '--radius-element': '10px',
    '--radius-container': '16px',
    '--radius-page': '26px',
    '--radius-full': '9999px',

    // Shadows (Design.md: Inset white highlight for elevation, surface contrast instead of drop shadows)
    '--shadow-low': 'rgba(255, 255, 255, 0.15) 0px 1px 2px 0px inset',
    '--shadow-med': 'rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset',
    '--shadow-high': 'rgba(255, 255, 255, 0.3) 0px 1px 4px 0px inset',

    // Focus and Inset rings - Midnight SRE (Periwinkle & Steel)
    '--shadow-inset-hover': 'inset 0px 0px 0px 1px #939db8',
    '--shadow-inset-selected': 'inset 0px 0px 0px 1px #98a4f7',
    '--shadow-inset-success': 'inset 0px 0px 0px 1px #22c55e',
    '--shadow-inset-warning': 'inset 0px 0px 0px 1px #f59e0b',
    '--shadow-inset-error': 'inset 0px 0px 0px 1px #ef4444',
  },

  components: {
    button: {
      'variant:destructive': {
        backgroundColor: 'var(--color-error-muted)',
        color: 'var(--color-error)',
        '--color-overlay-hover':
          'var(--astryx-theme-neutral-color-destructive-overlay-hover)',
        '--color-overlay-pressed':
          'var(--astryx-theme-neutral-color-destructive-overlay-pressed)',
      },
    },

    badge: {
      'variant:info': {
        backgroundColor: statusFill.info,
        color: '#FFFFFF',
      },
      'variant:neutral': {
        backgroundColor: 'var(--color-background-gray)',
        color: 'var(--color-text-gray)',
      },
      'variant:success': {
        backgroundColor: statusFill.success,
        color: 'var(--color-on-success)',
      },
      'variant:warning': {
        backgroundColor: statusFill.warning,
        color: 'var(--color-on-warning)',
      },
      'variant:error': {
        backgroundColor: statusFill.error,
        color: 'var(--color-on-error)',
      },
      'variant:cyan': {
        backgroundColor: statusFill.ai,
        color: '#FFFFFF',
      },
      'variant:blue': {
        backgroundColor: statusFill.info,
        color: '#FFFFFF',
      },
    },

    'status-dot': {
      'variant:success': {backgroundColor: statusFill.success},
      'variant:warning': {backgroundColor: statusFill.warning},
      'variant:error': {backgroundColor: statusFill.error},
      'variant:accent': {backgroundColor: statusFill.accent},
    },

    'avatar-status-dot': {
      'variant:success': {backgroundColor: statusFill.success},
      'variant:error': {backgroundColor: statusFill.error},
    },

    'segmented-control': {
      base: {
        padding: 'var(--spacing-1)',
      },
    },

    banner: {
      base: {
        '--color-neutral': 'var(--astryx-theme-neutral-color-on-tint-neutral)',
        '--color-overlay-hover':
          'var(--astryx-theme-neutral-color-on-tint-overlay-hover)',
        '--color-overlay-pressed':
          'var(--astryx-theme-neutral-color-on-tint-overlay-pressed)',
      },
      'status:info': {
        '--color-accent-muted': 'var(--color-background-blue)',
        '--color-text-primary': 'var(--color-text-blue)',
        '--color-text-secondary': 'var(--color-text-blue)',
        '--color-accent': 'var(--color-text-blue)',
      },
      'status:success': {
        '--color-text-primary': 'var(--color-text-green)',
        '--color-text-secondary': 'var(--color-text-green)',
        '--color-success': 'var(--color-text-green)',
      },
      'status:warning': {
        '--color-text-primary': 'var(--color-text-yellow)',
        '--color-text-secondary': 'var(--color-text-yellow)',
        '--color-warning': 'var(--color-text-yellow)',
      },
      'status:error': {
        '--color-text-primary': 'var(--color-text-red)',
        '--color-text-secondary': 'var(--color-text-red)',
        '--color-error': 'var(--color-text-red)',
      },
    },

    'step-indicator': {
      'status:accent': {'--color-accent': statusFill.accent},
      'status:success': {'--color-success': statusFill.success},
      'status:warning': {'--color-warning': statusFill.warning},
      'status:error': {'--color-error': statusFill.error},
    },

    'progress-bar': {
      base: {
        '--color-background-muted': 'var(--color-border-emphasized)',
      },
      'variant:accent': {
        '--color-accent': statusFill.accent,
      },
      'variant:success': {
        '--color-success': statusFill.success,
      },
      'variant:warning': {
        '--color-warning': statusFill.warning,
      },
      'variant:error': {
        '--color-error': statusFill.error,
      },
    },

    card: {
      base: {
        padding: 'var(--spacing-4)',
      },
    },

    section: {
      base: {
        padding: 'var(--spacing-3)',
      },
    },
  },

  icons: neutralIconRegistry,
});
