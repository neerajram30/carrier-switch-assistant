'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { ExtractedDataReviewStep } from './components/ExtractedDataReviewStep';
import { ManualEntryStep } from './components/ManualEntryStep';
import { OnboardingHeader } from './components/OnboardingHeader';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import {
  getCareerProfile,
  saveCareerProfile,
} from './services/career-profile.service';
import {
  processResume,
  uploadResumeDirectly,
} from './services/resume-storage.service';
import type {
  CareerProfileData,
  ExtractedCareerData,
  OnboardingStep,
  UploadedResumeInfo,
} from './types';

const INITIAL_PROFILE_STATE: CareerProfileData = {
  currentRole: '',
  yearsOfExperience: '',
  skills: [],
  summary: '',
};

type ProfileLoadStatus =
  | 'unloaded'
  | 'loading'
  | 'found'
  | 'not_found'
  | 'error';

interface CareerOnboardingPageProps {
  initialStep?: OnboardingStep;
  getProfileFn?: typeof getCareerProfile;
  saveProfileFn?: typeof saveCareerProfile;
  uploadFn?: typeof uploadResumeDirectly;
  processFn?: typeof processResume;
}

export default function CareerOnboardingPage({
  initialStep = 'upload',
  getProfileFn = getCareerProfile,
  saveProfileFn = saveCareerProfile,
  uploadFn = uploadResumeDirectly,
  processFn = processResume,
}: CareerOnboardingPageProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [profileData, setProfileData] = useState<CareerProfileData>(
    INITIAL_PROFILE_STATE,
  );
  const [extractedCareerData, setExtractedCareerData] =
    useState<ExtractedCareerData | null>(null);
  const [isExistingProfile, setIsExistingProfile] = useState<boolean>(false);
  const [profileStatus, setProfileStatus] = useState<ProfileLoadStatus>(
    initialStep === 'manual' ? 'loading' : 'unloaded',
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [, setUploadedFile] = useState<File | null>(null);
  const [, setUploadedResume] = useState<UploadedResumeInfo | null>(null);

  const handleRetryLoad = useCallback(() => {
    setLoadError(null);
    setProfileStatus('loading');
  }, []);

  // Fetch existing career profile when user navigates to manual entry
  useEffect(() => {
    if (step !== 'manual' || profileStatus !== 'loading') return;

    let isMounted = true;

    async function fetchProfile() {
      try {
        const existing = await getProfileFn();
        if (!isMounted) return;

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
          setProfileStatus('found');
        } else {
          setIsExistingProfile(false);
          setProfileStatus('not_found');
        }
      } catch (err) {
        if (!isMounted) return;
        setProfileStatus('error');
        setLoadError(
          (err as Error).message ||
            'Failed to load profile. Please check your connection and retry.',
        );
      }
    }

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [step, profileStatus, getProfileFn]);

  const handleUploadSuccess = (
    file: File,
    resumeInfo: UploadedResumeInfo,
  ) => {
    setUploadedFile(file);
    setUploadedResume(resumeInfo);
  };

  const handleContinueToReview = (extracted: ExtractedCareerData) => {
    setExtractedCareerData(extracted);
    setSaveError(null);
    setStep('review');
  };

  const handleReviewConfirm = async (
    profile: CareerProfileData,
  ) => {
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
      setProfileStatus('found');
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        (err as Error).message ||
          'Failed to save career profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualEntryComplete = async (profile: CareerProfileData) => {
    // Only allow submission when profile status has been confirmed (found or not_found)
    if (profileStatus !== 'found' && profileStatus !== 'not_found') {
      return;
    }

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
      setProfileStatus('found');
      setSaveSuccess(true);
    } catch (err) {
      // Preserve user-entered form data on failure
      setProfileData(profile);
      setSaveError(
        (err as Error).message ||
          'Failed to save career profile. Please try again.',
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
      <Card maxWidth={720} width="100%" elevation="low" padding={5}>
        <VStack gap={5} width="100%">
          <OnboardingHeader currentStep={step === 'upload' ? 1 : 2} />

          {saveSuccess && (
            <Card variant="green" elevation="none">
              <HStack gap={3} align="center" padding={3}>
                <StatusDot variant="success" label="Saved" />
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
                    Your details have been saved to PostgreSQL.
                  </Text>
                </VStack>
              </HStack>
            </Card>
          )}

          {step === 'upload' && (
            <ResumeUploadStep
              onSuccess={handleUploadSuccess}
              onContinueToReview={handleContinueToReview}
              uploadFn={uploadFn}
              processFn={processFn}
              onSwitchToManual={() => {
                setSaveError(null);
                setStep('manual');
                if (profileStatus === 'unloaded') {
                  setProfileStatus('loading');
                }
              }}
            />
          )}

          {step === 'review' && extractedCareerData && (
            <ExtractedDataReviewStep
              initialData={extractedCareerData}
              onConfirm={handleReviewConfirm}
              onBack={() => {
                setSaveError(null);
                setStep('upload');
              }}
              onSwitchToManual={() => {
                setProfileData({
                  currentRole: extractedCareerData.currentRole ?? '',
                  yearsOfExperience:
                    extractedCareerData.yearsOfExperience !== null
                      ? String(extractedCareerData.yearsOfExperience)
                      : '',
                  skills: extractedCareerData.skills ?? [],
                  summary: '',
                });
                setSaveError(null);
                setStep('manual');
                if (profileStatus === 'unloaded') {
                  setProfileStatus('loading');
                }
              }}
              isSaving={isSaving}
              saveError={saveError}
              onClearError={() => setSaveError(null)}
            />
          )}

          {step === 'manual' && (
            <ManualEntryStep
              key={profileData.id ?? 'new'}
              initialData={profileData}
              onContinue={handleManualEntryComplete}
              onBack={() => {
                setSaveError(null);
                setStep('upload');
              }}
              isSaving={isSaving}
              isLoadingExisting={profileStatus === 'loading'}
              loadError={loadError}
              onRetryLoad={handleRetryLoad}
              isSubmissionAllowed={
                profileStatus === 'found' || profileStatus === 'not_found'
              }
              errorMessage={saveError}
              onClearError={() => setSaveError(null)}
            />
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
