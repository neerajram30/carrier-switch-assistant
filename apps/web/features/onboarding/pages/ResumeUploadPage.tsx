'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResumeUploadStep } from '../components/ResumeUploadStep';
import { getCareerProfile } from '../services/career-profile.service';
import { saveExtractedDataToStorage } from '../services/onboarding-storage';
import {
  processResume,
  uploadResumeDirectly,
} from '../services/resume-storage.service';
import type { ExtractedCareerData } from '../types';

interface ResumeUploadPageProps {
  uploadFn?: typeof uploadResumeDirectly;
  processFn?: typeof processResume;
}

export default function ResumeUploadPage({
  uploadFn = uploadResumeDirectly,
  processFn = processResume,
}: ResumeUploadPageProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const [hasExistingProfile, setHasExistingProfile] = useState<boolean>(() => {
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

  useEffect(() => {
    let isMounted = true;
    void getCareerProfile()
      .then((existing) => {
        if (!isMounted) return;
        if (existing && (existing.currentRole || existing.id)) {
          setHasExistingProfile(true);
        }
      })
      .catch(() => {
        // Backend offline; preserve state
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleContinueToReview = (extractedData: ExtractedCareerData) => {
    saveExtractedDataToStorage(extractedData);
    router?.push('/onboarding/review');
  };

  const handleSwitchToManual = () => {
    router?.push('/onboarding/manual');
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
        {/* Option to return to internal dashboard if career data is already created */}
        {hasExistingProfile && (
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

        <ResumeUploadStep
          uploadFn={uploadFn}
          processFn={processFn}
          onContinueToReview={handleContinueToReview}
          onSwitchToManual={handleSwitchToManual}
        />
      </main>
    </div>
  );
}
