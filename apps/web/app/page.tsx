import type { Metadata } from 'next';
import { LandingNavbar } from '@/features/landing/LandingNavbar';
import { LandingHero } from '@/features/landing/LandingHero';
import { CareerSwitchSimulator } from '@/features/landing/CareerSwitchSimulator';
import { LandingFeatures } from '@/features/landing/LandingFeatures';
import { LandingHowItWorks } from '@/features/landing/LandingHowItWorks';
import { LandingComparison } from '@/features/landing/LandingComparison';
import { LandingTestimonials } from '@/features/landing/LandingTestimonials';
import { LandingFaq } from '@/features/landing/LandingFaq';
import { LandingFooter } from '@/features/landing/LandingFooter';
import { ScrollRevealProvider } from '@/features/landing/ScrollRevealProvider';

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

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Career Switch Assistant',
      operatingSystem: 'Any',
      applicationCategory: 'EducationalApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '3420',
        bestRating: '5',
        worstRating: '1',
      },
      description:
        'Evidence-based career readiness platform helping software engineers benchmark skill gaps and execute tailored weekly roadmaps.',
    },
    {
      '@type': 'WebSite',
      name: 'Career Switch Assistant',
      url: 'https://careerswitch.dev',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://careerswitch.dev/explore?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      {/* Search Engine Structured JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-[#0f101a] text-white flex flex-col selection:bg-[#5b63d3] selection:text-white">
        {/* Top Sticky Navigation */}
        <LandingNavbar />

        <ScrollRevealProvider>
          {/* Main Landing Page Content */}
          <main id="main-content" className="flex-1">
            {/* Hero Section */}
            <LandingHero />

            {/* Interactive Career Switch Simulator */}
            <CareerSwitchSimulator />

            {/* Core Features */}
            <LandingFeatures />

            {/* How It Works */}
            <LandingHowItWorks />

            {/* Comparison Matrix */}
            <LandingComparison />

            {/* Social Proof & Outcomes */}
            <LandingTestimonials />

            {/* Frequently Asked Questions */}
            <LandingFaq />
          </main>

          {/* Footer */}
          <LandingFooter />
        </ScrollRevealProvider>
      </div>
    </>
  );
}
