import { LandingNavbar } from '@/features/landing/LandingNavbar';
import { LandingHero } from '@/features/landing/LandingHero';
import { CareerSwitchSimulator } from '@/features/landing/CareerSwitchSimulator';
import { LandingFeatures } from '@/features/landing/LandingFeatures';
import { LandingHowItWorks } from '@/features/landing/LandingHowItWorks';
import { LandingComparison } from '@/features/landing/LandingComparison';
import { LandingFaq } from '@/features/landing/LandingFaq';
import { LandingFooter } from '@/features/landing/LandingFooter';
import { ScrollRevealProvider } from '@/features/landing/ScrollRevealProvider';

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

export function LandingView() {
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
