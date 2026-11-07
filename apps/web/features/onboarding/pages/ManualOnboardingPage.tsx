'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { ManualGuidedStep } from '../components/ManualGuidedStep';
import {
  getCareerProfile,
  saveCareerProfile,
} from '../services/career-profile.service';
import type { CareerProfileData } from '../types';

const INITIAL_PROFILE_STATE: CareerProfileData = {
  currentRole: '',
  yearsOfExperience: '',
  skills: [],
  summary: '',
  targetRole: '',
};

interface ManualOnboardingPageProps {
  getProfileFn?: typeof getCareerProfile;
  saveProfileFn?: typeof saveCareerProfile;
}

export default function ManualOnboardingPage({
  getProfileFn = getCareerProfile,
  saveProfileFn = saveCareerProfile,
}: ManualOnboardingPageProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const [profileData, setProfileData] =
    useState<CareerProfileData>(INITIAL_PROFILE_STATE);
  const [isExistingProfile, setIsExistingProfile] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load existing profile if any
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const existing = await getProfileFn();
        if (!isMounted || !existing) return;
        setProfileData({
          id: existing.id,
          currentRole: existing.currentRole,
          yearsOfExperience: String(existing.yearsOfExperience),
          skills: existing.skills ?? [],
          summary: existing.summary ?? '',
          targetRole: existing.targetRole ?? '',
        });
        setIsExistingProfile(true);
      } catch {
        // Fallback to fresh entry
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [getProfileFn]);

  const handleSubmit = async (data: CareerProfileData) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const saved = await saveProfileFn(data, isExistingProfile);
      setProfileData({
        id: saved.id,
        currentRole: saved.currentRole,
        yearsOfExperience: String(saved.yearsOfExperience),
        skills: saved.skills ?? [],
        summary: saved.summary ?? '',
        targetRole: saved.targetRole ?? '',
      });
      setIsExistingProfile(true);
      setSaveSuccess(true);

      // Auto-navigate to dashboard
      if (router) {
        setTimeout(() => {
          router?.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setProfileData(data);
      setSaveError(
        (err as Error).message ||
          'Failed to save career profile. Please try again.',
      );
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
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '40px 20px 80px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Success Banner */}
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

        {/* Error Banner */}
        {saveError && (
          <Card
            variant="red"
            elevation="none"
            style={{
              border: '1px solid var(--color-border-red, #dc2626)',
              padding: '12px 16px',
            }}
          >
            <HStack justify="between" align="center">
              <Text type="body" style={{ color: 'var(--color-text-red, #f87171)' }}>
                {saveError}
              </Text>
              <Button
                label="Dismiss"
                variant="ghost"
                size="sm"
                onClick={() => setSaveError(null)}
              />
            </HStack>
          </Card>
        )}

        {/* Guided Step */}
        <ManualGuidedStep
          initialData={profileData}
          onSubmit={handleSubmit}
          onBackToUpload={() => router?.push('/onboarding')}
          isSubmitting={isSaving}
        />
      </main>
    </div>
  );
}
