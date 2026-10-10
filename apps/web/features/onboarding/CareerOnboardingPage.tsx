'use client';

import { useEffect, useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { ManualEntryStep } from './components/ManualEntryStep';
import { OnboardingHeader } from './components/OnboardingHeader';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import {
  getCareerProfile,
  saveCareerProfile,
} from './services/career-profile.service';
import type {
  CareerProfileData,
  OnboardingStep,
  UploadedResumeInfo,
} from './types';

const INITIAL_PROFILE_STATE: CareerProfileData = {
  currentRole: '',
  yearsOfExperience: '',
  skills: [],
  summary: '',
};

interface CareerOnboardingPageProps {
  initialStep?: OnboardingStep;
  getProfileFn?: typeof getCareerProfile;
  saveProfileFn?: typeof saveCareerProfile;
}

export default function CareerOnboardingPage({
  initialStep = 'upload',
  getProfileFn = getCareerProfile,
  saveProfileFn = saveCareerProfile,
}: CareerOnboardingPageProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [profileData, setProfileData] = useState<CareerProfileData>(
    INITIAL_PROFILE_STATE,
  );
  const [isExistingProfile, setIsExistingProfile] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [, setUploadedFile] = useState<File | null>(null);
  const [, setUploadedResume] = useState<UploadedResumeInfo | null>(null);

  // Fetch existing career profile when user navigates to manual entry
  useEffect(() => {
    if (step !== 'manual') return;

    let isCancelled = false;

    async function loadExistingProfile() {
      setIsLoadingProfile(true);
      try {
        const existing = await getProfileFn();
        if (isCancelled) return;

        if (existing) {
          setProfileData({
            id: existing.id,
            currentRole: existing.currentRole,
            yearsOfExperience: String(existing.yearsOfExperience),
            skills: existing.skills ?? [],
            summary: existing.summary ?? '',
            targetRole: existing.targetRole ?? '',
          });
          setIsExistingProfile(true);
        } else {
          setIsExistingProfile(false);
        }
      } catch (err) {
        if (isCancelled) return;
        setSaveError(
          (err as Error).message || 'Could not check existing profile status',
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadExistingProfile();

    return () => {
      isCancelled = true;
    };
  }, [step, getProfileFn]);

  const handleUploadSuccess = (
    file: File,
    resumeInfo: UploadedResumeInfo,
  ) => {
    setUploadedFile(file);
    setUploadedResume(resumeInfo);
  };

  const handleManualEntryComplete = async (profile: CareerProfileData) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const saved = await saveProfileFn(profile, isExistingProfile);
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
    } catch (err) {
      // Preserve user-entered form data on failure
      setProfileData(profile);
      setSaveError(
        (err as Error).message || 'Failed to save career profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VStack
      as="main"
      hAlign="center"
      vAlign="center"
      width="100%"
      minHeight="100vh"
      padding={4}
    >
      <Card maxWidth={680} width="100%" elevation="low" padding={5}>
        <VStack gap={5} width="100%">
          <OnboardingHeader currentStep={step === 'upload' ? 1 : 2} />

          {saveSuccess && (
            <Card variant="green" elevation="none">
              <HStack gap={3} align="center" padding={3}>
                <StatusDot variant="success" label="Saved" />
                <VStack gap={1}>
                  <Heading level={4} weight="medium" style={{ color: 'var(--color-text-green)' }}>
                    Career profile saved successfully!
                  </Heading>
                  <Text type="supporting" style={{ color: 'var(--color-text-green)' }}>
                    Your details have been saved to PostgreSQL.
                  </Text>
                </VStack>
              </HStack>
            </Card>
          )}

          {step === 'upload' && (
            <ResumeUploadStep
              onSuccess={handleUploadSuccess}
              onSwitchToManual={() => {
                setSaveError(null);
                setStep('manual');
              }}
            />
          )}

          {step === 'manual' && (
            <ManualEntryStep
              key={profileData.id ?? (isLoadingProfile ? 'loading' : 'ready')}
              initialData={profileData}
              onContinue={handleManualEntryComplete}
              onBack={() => {
                setSaveError(null);
                setStep('upload');
              }}
              isSaving={isSaving}
              isLoadingExisting={isLoadingProfile}
              errorMessage={saveError}
              onClearError={() => setSaveError(null)}
            />
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
