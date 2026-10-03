'use client';

import { useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/Stack';
import { AnalysisTransitionStep } from './components/AnalysisTransitionStep';
import { CareerGoalStep } from './components/CareerGoalStep';
import { ManualEntryStep } from './components/ManualEntryStep';
import { OnboardingHeader } from './components/OnboardingHeader';
import { ProfileReviewStep } from './components/ProfileReviewStep';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import type { CareerProfileData, OnboardingStep } from './types';

const INITIAL_PROFILE_STATE: CareerProfileData = {
  currentRole: '',
  yearsOfExperience: '',
  skills: [],
  summary: '',
  targetRole: '',
  source: 'manual',
};

export default function CareerOnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('upload');
  const [profileData, setProfileData] = useState<CareerProfileData>(
    INITIAL_PROFILE_STATE,
  );

  const handleUploadSuccess = (extracted: CareerProfileData) => {
    setProfileData(extracted);
    setStep('review');
  };

  const handleManualEntryComplete = (manual: CareerProfileData) => {
    setProfileData(manual);
    setStep('goal');
  };

  const handleReviewComplete = (updated: CareerProfileData) => {
    setProfileData(updated);
    setStep('goal');
  };

  const handleGoalSave = (targetRole: string) => {
    setProfileData((prev) => ({ ...prev, targetRole }));
    setStep('analyzing');
  };

  const getStepIndicator = (): 1 | 2 | null => {
    if (step === 'upload' || step === 'manual' || step === 'review') {
      return 1;
    }
    if (step === 'goal') {
      return 2;
    }
    return null;
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
          <OnboardingHeader currentStep={getStepIndicator()} />

          {step === 'upload' && (
            <ResumeUploadStep
              onSuccess={handleUploadSuccess}
              onSwitchToManual={() => setStep('manual')}
            />
          )}

          {step === 'manual' && (
            <ManualEntryStep
              initialData={profileData}
              onContinue={handleManualEntryComplete}
              onBack={() => setStep('upload')}
            />
          )}

          {step === 'review' && (
            <ProfileReviewStep
              initialData={profileData}
              onContinue={handleReviewComplete}
              onReupload={() => setStep('upload')}
            />
          )}

          {step === 'goal' && (
            <CareerGoalStep
              initialRole={profileData.targetRole}
              onSave={handleGoalSave}
              onBack={() => setStep(profileData.source === 'ai_extracted' ? 'review' : 'manual')}
            />
          )}

          {(step === 'analyzing' || step === 'complete') && (
            <AnalysisTransitionStep
              data={profileData}
              onEdit={() => setStep('review')}
            />
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
