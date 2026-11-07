'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { ExtractedDataReviewStep } from '../components/ExtractedDataReviewStep';
import { saveCareerProfile } from '../services/career-profile.service';
import {
  clearExtractedDataFromStorage,
  getExtractedDataFromStorage,
  saveExtractedDataToStorage,
} from '../services/onboarding-storage';
import type { CareerProfileData, ExtractedCareerData } from '../types';

interface ReviewOnboardingPageProps {
  initialData?: ExtractedCareerData;
  saveProfileFn?: typeof saveCareerProfile;
}

const DEFAULT_EXTRACTED_SAMPLE: ExtractedCareerData = {
  name: null,
  currentRole: '',
  yearsOfExperience: null,
  skills: [],
  summary: '',
  workExperience: [],
  education: [],
  projects: [],
};

export default function ReviewOnboardingPage({
  initialData,
  saveProfileFn = saveCareerProfile,
}: ReviewOnboardingPageProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const [extractedData] = useState<ExtractedCareerData>(() => {
    if (initialData) return initialData;
    const fromStorage = getExtractedDataFromStorage();
    if (fromStorage) return fromStorage;
    return DEFAULT_EXTRACTED_SAMPLE;
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleConfirm = async (
    profile: CareerProfileData,
    fullData?: ExtractedCareerData,
  ) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const fullProfileToSave = {
      ...profile,
      workExperience:
        fullData?.workExperience && fullData.workExperience.length > 0
          ? fullData.workExperience
          : extractedData.workExperience || [],
      education:
        fullData?.education && fullData.education.length > 0
          ? fullData.education
          : extractedData.education || [],
      projects:
        fullData?.projects && fullData.projects.length > 0
          ? fullData.projects
          : extractedData.projects || [],
      suggestedPaths:
        fullData?.suggestedPaths || extractedData.suggestedPaths || undefined,
      userPrompt: fullData?.summary || profile.summary || undefined,
    };

    // Save profile to sessionStorage so dashboard picks it up immediately
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('csa_career_profile', JSON.stringify(fullProfileToSave));
        if (fullData) {
          saveExtractedDataToStorage(fullData);
        }
      } catch {
        // Ignore fallback
      }
    }

    try {
      await saveProfileFn(fullProfileToSave, false);
      clearExtractedDataFromStorage();
      setSaveSuccess(true);
      router?.push('/dashboard');
    } catch {
      // Backend may be offline; proceed smoothly to dashboard using saved session profile
      clearExtractedDataFromStorage();
      router?.push('/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--color-void-black, #0f101a)',
        color: 'var(--color-pure-white, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main Full-Page Content - Clean View (Navbar removed) */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1360,
          margin: '0 auto',
          padding: '28px 32px 100px 32px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Success Banner if shown */}
        {saveSuccess && (
          <Card
            variant="green"
            elevation="none"
            style={{
              border:
                '1px solid var(--color-border-green, rgba(16, 185, 129, 0.3))',
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
            }}
          >
            <VStack gap={4} padding={4}>
              <HStack justify="between" align="center" wrap="wrap" gap={2}>
                <HStack gap={3} align="center">
                  <StatusDot variant="success" label="Trajectory Locked" />
                  <VStack gap={1}>
                    <Heading
                      level={4}
                      weight="medium"
                      style={{ color: 'var(--color-text-green)' }}
                    >
                      Career profile saved successfully!
                    </Heading>
                    <Text
                      type="supporting"
                      style={{ color: 'var(--color-text-green)' }}
                    >
                      Trajectory locked &amp; baseline established. Your roadmap engine is ready.
                    </Text>
                  </VStack>
                </HStack>

                <Button
                  label="Go to Dashboard →"
                  variant="primary"
                  size="sm"
                  onClick={() => router?.push('/dashboard')}
                />
              </HStack>
            </VStack>
          </Card>
        )}

        {/* The Full Editable Report Form */}
        <ExtractedDataReviewStep
          initialData={extractedData}
          onConfirm={handleConfirm}
          onBack={() => router?.push('/onboarding')}
          onSwitchToManual={() => router?.push('/onboarding/manual')}
          isSaving={isSaving}
          saveError={saveError}
          onClearError={() => setSaveError(null)}
        />
      </main>
    </div>
  );
}
