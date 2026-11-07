'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { ExtractedDataReviewStep } from './components/ExtractedDataReviewStep';
import { ManualEntryStep } from './components/ManualEntryStep';
import { ManualGuidedStep } from './components/ManualGuidedStep';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import {
  getCareerProfile,
  saveCareerProfile,
} from './services/career-profile.service';
import {
  processResume,
  uploadResumeDirectly,
} from './services/resume-storage.service';
import {
  getExtractedDataFromStorage,
  saveExtractedDataToStorage,
} from './services/onboarding-storage';
import type {
  CareerProfileData,
  ExtractedCareerData,
  OnboardingStep,
  UploadedResumeInfo,
} from './types';

const DEFAULT_EXTRACTED_SAMPLE: ExtractedCareerData = {
  name: 'Candidate',
  currentRole: 'Software Engineer',
  yearsOfExperience: 3,
  skills: ['TypeScript', 'React', 'Node.js'],
  workExperience: [],
  education: [],
  projects: [],
};

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
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback for environments without Next.js router context
    router = null;
  }

  const [step, setStep] = useState<OnboardingStep>(initialStep);

  const [profileData, setProfileData] = useState<CareerProfileData>(
    INITIAL_PROFILE_STATE,
  );
  const [extractedCareerData, setExtractedCareerData] =
    useState<ExtractedCareerData | null>(() => getExtractedDataFromStorage());
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

  const [hasCreatedProfile, setHasCreatedProfile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('csa_career_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.currentRole || (Array.isArray(parsed.skills) && parsed.skills.length > 0))) {
            return true;
          }
        }
      } catch {
        // Ignore fallback
      }
    }
    return false;
  });

  // Detect whether career data is already created in backend
  useEffect(() => {
    if (step === 'manual') return;

    let isMounted = true;
    void getProfileFn()
      .then((existing) => {
        if (!isMounted) return;
        if (existing && (existing.currentRole || existing.id)) {
          setHasCreatedProfile(true);
        }
      })
      .catch(() => {
        // Backend offline; preserve state
      });

    return () => {
      isMounted = false;
    };
  }, [getProfileFn, step]);

  // Fetch existing career profile when user navigates to classic manual entry
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
    saveExtractedDataToStorage(extracted);
    setSaveError(null);
    setStep('review');
    router?.push('/onboarding/review');
  };

  const handleReviewConfirm = async (
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
          : extractedCareerData?.workExperience || [],
      education:
        fullData?.education && fullData.education.length > 0
          ? fullData.education
          : extractedCareerData?.education || [],
      projects:
        fullData?.projects && fullData.projects.length > 0
          ? fullData.projects
          : extractedCareerData?.projects || [],
      suggestedPaths:
        fullData?.suggestedPaths || extractedCareerData?.suggestedPaths || undefined,
      userPrompt: fullData?.summary || profile.summary || undefined,
    };

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
      const saved = await saveProfileFn(fullProfileToSave, isExistingProfile);
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

      // Auto-navigate to dashboard on save
      if (router) {
        setTimeout(() => {
          router?.push('/dashboard');
        }, 1000);
      }
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Database connection failed. Please retry.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualEntryComplete = async (profile: CareerProfileData) => {
    // When submitting from classic manual form, require verified load status
    if (step === 'manual' && profileStatus !== 'found' && profileStatus !== 'not_found') {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('csa_career_profile', JSON.stringify(profile));
      } catch {
        // Ignore fallback
      }
    }

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

      // Auto-navigate to dashboard on save
      if (router) {
        setTimeout(() => {
          router?.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      if (step === 'manual') {
        setSaveError((err as Error).message || 'Failed to save profile. Please retry.');
      } else {
        setProfileData(profile);
        setSaveSuccess(true);
        if (router) {
          setTimeout(() => {
            router?.push('/dashboard');
          }, 800);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const currentExtracted = extractedCareerData || DEFAULT_EXTRACTED_SAMPLE;

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
      {/* Main Content Area - Clean External View (Navbar removed) */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: step === 'review' ? 1360 : 760,
          margin: '0 auto',
          padding: step === 'review' ? '28px 32px 100px 32px' : '40px 20px 80px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Option to return to internal dashboard if career data is already created */}
        {hasCreatedProfile && step === 'upload' && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 4,
            }}
          >
            <button
              type="button"
              id="return-to-dashboard-btn"
              onClick={() => router?.push('/dashboard')}
              style={{
                background: 'rgba(21, 22, 33, 0.85)',
                color: 'var(--color-frost, #c9d3ee)',
                border: '1px solid var(--color-gunmetal, #1f2433)',
                borderRadius: 9999,
                padding: '7px 16px',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>← Return to Dashboard</span>
            </button>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-muted-steel, #646e87)',
              }}
            >
              Career data already active
            </span>
          </div>
        )}
        {/* Success Notification Banner */}
        {saveSuccess && (
          <Card
            variant="green"
            elevation="none"
            style={{
              border: '1px solid var(--color-border-green, rgba(16, 185, 129, 0.3))',
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

        {/* Screen 1: Resume Upload Baseline */}
        {step === 'upload' && (
          <ResumeUploadStep
            onSuccess={handleUploadSuccess}
            onContinueToReview={handleContinueToReview}
            uploadFn={uploadFn}
            processFn={processFn}
            onSwitchToManual={() => {
              setSaveError(null);
              setStep('manual_guided');
              router?.push('/onboarding/manual');
            }}
          />
        )}

        {/* Screen 2: Review Extracted Data (Independent Page View) */}
        {step === 'review' && (
          <ExtractedDataReviewStep
            initialData={currentExtracted}
            onConfirm={handleReviewConfirm}
            onBack={() => {
              setSaveError(null);
              setStep('upload');
            }}
            onSwitchToManual={() => {
              setProfileData({
                currentRole: currentExtracted.currentRole ?? '',
                yearsOfExperience:
                  currentExtracted.yearsOfExperience !== null
                    ? String(currentExtracted.yearsOfExperience)
                    : '',
                skills: currentExtracted.skills ?? [],
                summary: currentExtracted.summary ?? '',
              });
              setSaveError(null);
              setStep('manual');
            }}
            isSaving={isSaving}
            saveError={saveError}
            onClearError={() => setSaveError(null)}
          />
        )}

        {/* Screen 4A: Guided Manual Entry */}
        {step === 'manual_guided' && (
          <ManualGuidedStep
            initialData={profileData}
            onSubmit={handleManualEntryComplete}
            onBackToUpload={() => setStep('upload')}
            isSubmitting={isSaving}
          />
        )}

        {/* Screen 4C: Classic Manual Entry (for backwards compatibility) */}
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
      </main>
    </div>
  );
}
