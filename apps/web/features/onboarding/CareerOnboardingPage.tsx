'use client';

import { useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/Stack';
import { ManualEntryStep } from './components/ManualEntryStep';
import { OnboardingHeader } from './components/OnboardingHeader';
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
  const [, setUploadedFile] = useState<File | null>(null);

  const handleUploadSuccess = (file: File) => {
    setUploadedFile(file);
  };

  const handleManualEntryComplete = (manual: CareerProfileData) => {
    setProfileData(manual);
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
        </VStack>
      </Card>
    </VStack>
  );
}
