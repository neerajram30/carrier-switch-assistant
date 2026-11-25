import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Switch Assistant | Evidence-Based Career Transition Platform',
  description:
    'Turn your target software engineering role into an actionable 12-week roadmap. Benchmark verified skills, eliminate guesswork with market-calibrated gap analysis, and land senior roles with clarity.',
  keywords: [
    'Career Switch Assistant',
    'software engineering career roadmap',
    'skill gap analysis',
    'developer career transition',
    'frontend to fullstack transition',
    'ai engineer roadmap',
    'site reliability engineering transition',
    '12-week software roadmap',
    'SRE career platform',
  ],
  authors: [{ name: 'Career Switch Assistant Team' }],
  creator: 'Career Switch Assistant',
  publisher: 'Career Switch Assistant',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://careerswitch.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Career Switch Assistant',
    title: 'Career Switch Assistant | Evidence-Based Career Transition Platform',
    description:
      'Benchmark verified skills, isolate technical bottlenecks, and execute structured 12-week transition sprints into high-demand software roles.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Career Switch Assistant — SRE & Engineering Career Flight Deck',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Switch Assistant | Evidence-Based Career Transition Platform',
    description:
      'Benchmark verified skills, isolate technical bottlenecks, and execute structured 12-week transition sprints.',
    creator: '@careerswitch',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
