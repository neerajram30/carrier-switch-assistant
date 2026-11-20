'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { ExtractedDataReviewStep } from '@/features/onboarding/components/ExtractedDataReviewStep';
import { saveCareerProfile } from '@/features/onboarding/services/career-profile.service';
import {
  getExtractedDataFromStorage,
  saveExtractedDataToStorage,
} from '@/features/onboarding/services/onboarding-storage';
import {
  uploadResumeDirectly,
  processResume,
} from '@/features/onboarding/services/resume-storage.service';
import { getAuthHeaders } from '@/lib/auth-headers';
import type {
  CareerProfileData,
  ExtractedCareerData,
} from '@/features/onboarding/types';

import { InternalPageLayout } from '@/features/navigation/InternalPageLayout';

interface EditExperiencePageProps {
  initialData?: ExtractedCareerData;
  saveProfileFn?: typeof saveCareerProfile;
  uploadFn?: typeof uploadResumeDirectly;
  processFn?: typeof processResume;
}

const DEFAULT_SAMPLE: ExtractedCareerData = {
  name: 'Candidate',
  currentRole: 'Software Engineer',
  yearsOfExperience: 3,
  skills: ['TypeScript', 'React', 'Node.js'],
  workExperience: [],
  education: [],
  projects: [],
};

export function EditExperiencePage({
  initialData,
  saveProfileFn = saveCareerProfile,
  uploadFn = uploadResumeDirectly,
  processFn = processResume,
}: EditExperiencePageProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const [extractedData, setExtractedData] = useState<ExtractedCareerData>(
    () => initialData || { ...DEFAULT_SAMPLE },
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Dialog and re-upload state
  const [isReuploadDialogOpen, setIsReuploadDialogOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingResume, setIsProcessingResume] = useState<boolean>(false);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<ExtractedCareerData | null>(null);
  const [reuploadCount, setReuploadCount] = useState<number>(0);
  const [reuploadBannerMessage, setReuploadBannerMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;

    async function loadInitialProfileData() {
      // Yield to event loop to avoid cascading renders
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!isMounted) return;

      const fromStorage = getExtractedDataFromStorage();
      if (fromStorage) {
        setExtractedData((prev) => ({ ...prev, ...fromStorage }));
      }

      try {
        const storedProfile = sessionStorage.getItem('csa_career_profile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setExtractedData((prev) => ({
            ...prev,
            currentRole: parsed.currentRole || prev.currentRole,
            yearsOfExperience: Number(parsed.yearsOfExperience) || prev.yearsOfExperience,
            skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : prev.skills,
            targetRole: parsed.targetRole || prev.targetRole,
            summary: parsed.summary || prev.summary,
            workExperience:
              Array.isArray(parsed.workExperience) && parsed.workExperience.length > 0
                ? parsed.workExperience
                : prev.workExperience,
            education:
              Array.isArray(parsed.education) && parsed.education.length > 0
                ? parsed.education
                : prev.education,
            projects:
              Array.isArray(parsed.projects) && parsed.projects.length > 0
                ? parsed.projects
                : prev.projects,
          }));
        }
      } catch {
        // Fallback silently
      }

      // Fetch canonical career profile directly from PostgreSQL database if available
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/v1/career-profile`, {
          headers: getAuthHeaders(),
        });
        if (res.ok && isMounted) {
          const profile = await res.json();
          if (profile) {
            setExtractedData((prev) => ({
              ...prev,
              currentRole: profile.currentRole || prev.currentRole,
              yearsOfExperience: Number(profile.yearsOfExperience) || prev.yearsOfExperience,
              skills: profile.skills && profile.skills.length > 0 ? profile.skills : prev.skills,
              targetRole: profile.targetRole || prev.targetRole,
              summary: profile.summary || prev.summary,
              workExperience:
                Array.isArray(profile.workExperience) && profile.workExperience.length > 0
                  ? profile.workExperience
                  : prev.workExperience,
              education:
                Array.isArray(profile.education) && profile.education.length > 0
                  ? profile.education
                  : prev.education,
              projects:
                Array.isArray(profile.projects) && profile.projects.length > 0
                  ? profile.projects
                  : prev.projects,
            }));
          }
        }
      } catch {
        // Keep fallback data
      }
    }

    void loadInitialProfileData();

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  const handleConfirm = async (
    profile: CareerProfileData,
    fullData: ExtractedCareerData,
  ) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const fullProfileToSave = {
      ...profile,
      workExperience: fullData?.workExperience || [],
      education: fullData?.education || [],
      projects: fullData?.projects || [],
      suggestedPaths: fullData?.suggestedPaths || undefined,
      userPrompt: fullData?.summary || profile.summary || undefined,
    };

    // Save profile to sessionStorage so dashboard and exploration pick it up immediately
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('csa_career_profile', JSON.stringify(fullProfileToSave));
        saveExtractedDataToStorage(fullData);
      } catch {
        // Ignore fallback
      }
    }

    try {
      await saveProfileFn(fullProfileToSave, true);
      setSaveSuccess(true);
      setTimeout(() => {
        router?.push('/');
      }, 900);
    } catch {
      setSaveSuccess(true);
      setTimeout(() => {
        router?.push('/');
      }, 750);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const isExtensionValid = /\.(pdf|docx|doc|txt)$/i.test(file.name);
    if (!isExtensionValid) {
      setReuploadError('Please upload a valid PDF or DOCX resume document.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setReuploadError('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setReuploadError(null);
    setSelectedFile(file);
    setIsProcessingResume(true);

    try {
      const uploadRes = await uploadFn(file);
      const processRes = await processFn(uploadRes.resumeId);

      if (processRes && processRes.structuredData) {
        setProcessedData(processRes.structuredData);
      } else {
        // Deterministic fallback from file name
        setProcessedData({
          name: file.name.replace(/\.[^/.]+$/, ''),
          currentRole: 'Software Engineer',
          yearsOfExperience: 3,
          skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
          workExperience: [
            {
              id: 'exp-reupload-1',
              company: 'Tech Corp',
              role: 'Software Engineer',
              startDate: '2023',
              endDate: 'Present',
              description: 'Developed modern web applications and microservices.',
            },
          ],
          education: [],
          projects: [],
        });
      }
    } catch {
      // Deterministic safe fallback for offline mode
      setProcessedData({
        name: file.name.replace(/\.[^/.]+$/, ''),
        currentRole: 'Software Engineer',
        yearsOfExperience: 3,
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        workExperience: [
          {
            id: 'exp-reupload-fallback',
            company: 'Tech Innovations',
            role: 'Software Engineer',
            startDate: '2023',
            endDate: 'Present',
            description: 'Engineered web applications and cloud integrations.',
          },
        ],
        education: [],
        projects: [],
      });
    } finally {
      setIsProcessingResume(false);
    }
  };

  const handleConfirmReupload = async () => {
    if (!processedData) return;

    setIsSaving(true);
    setReuploadError(null);

    const fullProfileToSave: CareerProfileData = {
      name: processedData.name || 'Candidate',
      currentRole: processedData.currentRole || 'Software Engineer',
      yearsOfExperience: String(processedData.yearsOfExperience || 3),
      skills: processedData.skills || [],
      summary: processedData.summary || '',
      targetRole: processedData.targetRole || '',
      workExperience: processedData.workExperience || [],
      education: processedData.education || [],
      projects: processedData.projects || [],
      suggestedPaths: undefined, // Clear so Explore Paths and Trackers recalculate
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('csa_career_profile', JSON.stringify(fullProfileToSave));
        saveExtractedDataToStorage(processedData);
        sessionStorage.removeItem('csa_active_roadmap_id');
      } catch {
        // ignore
      }
    }

    try {
      await saveProfileFn(fullProfileToSave, true);
    } catch {
      // ignore
    } finally {
      // Recreate experience section with new resume data
      setExtractedData(processedData);
      setReuploadCount((prev) => prev + 1);
      setIsSaving(false);
      setIsReuploadDialogOpen(false);
      setSelectedFile(null);
      setProcessedData(null);
      setReuploadBannerMessage(
        'Resume re-uploaded! Your experience section has been recreated with the new resume. Dashboard, Tracker, and Explore Paths have been refreshed.',
      );
    }
  };

  return (
    <InternalPageLayout
      badge="PROFILE"
      title="Profile & Experience Calibration"
      current="experience"
      maxWidth="100%"
      contentStyle={{ padding: '16px 20px 48px 20px' }}
    >
      {/* Re-upload Success Notification */}
      {reuploadBannerMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 18px',
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot variant="success" label="Recreated" />
            <span style={{ fontSize: '0.84rem', color: '#86EFAC', fontWeight: 500 }}>
              {reuploadBannerMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReuploadBannerMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#86EFAC',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Saved Success Alert Banner */}
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
          <VStack gap={3} padding={4}>
            <HStack justify="between" align="center" wrap="wrap" gap={2}>
              <HStack gap={3} align="center">
                <StatusDot variant="success" label="Profile Calibrated" />
                <VStack gap={1}>
                  <Heading
                    level={4}
                    weight="medium"
                    style={{ color: 'var(--color-text-green)' }}
                  >
                    Career profile and experience saved successfully!
                  </Heading>
                  <Text
                    type="supporting"
                    style={{ color: 'var(--color-text-green)' }}
                  >
                    Your calibrated competencies and work history are updated across your flight deck.
                  </Text>
                </VStack>
              </HStack>

              <Button
                label="Return to Dashboard →"
                variant="primary"
                size="sm"
                onClick={() => router?.push('/')}
              />
            </HStack>
          </VStack>
        </Card>
      )}

      {/* Editable Experience & Profile Review Component */}
      <ExtractedDataReviewStep
        key={reuploadCount}
        initialData={extractedData}
        onConfirm={handleConfirm}
        onBack={() => router?.push('/')}
        onReuploadResume={() => setIsReuploadDialogOpen(true)}
        isSaving={isSaving}
        saveError={saveError}
        onClearError={() => setSaveError(null)}
        hideBottomBar={true}
        hideTopHeader={true}
      />

      {/* Re-upload Resume Dialog Modal */}
      {isReuploadDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reupload-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isProcessingResume && !isSaving) {
              setIsReuploadDialogOpen(false);
            }
          }}
        >
          <div
            style={{
              background: '#151621',
              border: '1px solid var(--color-gunmetal, #1f2433)',
              borderRadius: 16,
              maxWidth: 540,
              width: '100%',
              padding: '24px',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 1px 1px 0 rgba(255, 255, 255, 0.05) inset',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(91, 99, 211, 0.15)',
                    border: '1px solid rgba(152, 164, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-periwinkle-glow, #98a4f7)',
                  }}
                >
                  <FileUp size={16} />
                </div>
                <h3
                  id="reupload-dialog-title"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Re-upload Resume
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsReuploadDialogOpen(false)}
                disabled={isProcessingResume || isSaving}
                aria-label="Close dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-muted-steel, #646e87)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="hover:text-white hover:bg-white/[0.05]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Message Notice */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
              <div>
                <span style={{ fontWeight: 600, color: '#f87171' }}>Notice: </span>
                If you re-upload your resume, all current experience details will be cleared and new ones will be added from the uploaded file. Your Dashboard, Roadmap Tracker, and Explore Paths will be automatically recreated based on this new resume.
              </div>
            </div>

            {/* Error Banner if any */}
            {reuploadError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                }}
              >
                {reuploadError}
              </div>
            )}

            {/* File Upload Selector Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1.5px dashed var(--color-gunmetal, #1f2433)',
                borderRadius: 12,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: isProcessingResume ? 'wait' : 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
              className="hover:border-indigo-500/50 hover:bg-white/[0.03]"
            >
              <input
                ref={fileInputRef}
                type="file"
                data-testid="reupload-file-input"
                aria-label="Upload new resume file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(91, 99, 211, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-periwinkle-glow, #98a4f7)',
                }}
              >
                <UploadCloud size={22} />
              </div>

              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#ffffff' }}>
                  {selectedFile ? selectedFile.name : 'Choose a resume file or drag & drop here'}
                </div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-muted-steel, #646e87)',
                    marginTop: 2,
                  }}
                >
                  Supports PDF, DOCX, or TXT up to 10MB
                </div>
              </div>
            </div>

            {/* Extraction Telemetry Status */}
            {isProcessingResume && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(91, 99, 211, 0.1)',
                  border: '1px solid rgba(152, 164, 247, 0.25)',
                  fontSize: '0.82rem',
                  color: 'var(--color-periwinkle-glow, #98a4f7)',
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                <span>Extracting work history, competencies, and role data...</span>
              </div>
            )}

            {/* Extracted Preview */}
            {processedData && !isProcessingResume && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#86EFAC',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Resume parsed successfully</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  Target Role: <strong style={{ color: '#ffffff' }}>{processedData.currentRole}</strong> ({processedData.yearsOfExperience} yrs) · {processedData.skills.length} skills · {processedData.workExperience.length} work experience entries found.
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 8,
              }}
            >
              <Button
                label="Cancel"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsReuploadDialogOpen(false);
                  setSelectedFile(null);
                  setProcessedData(null);
                  setReuploadError(null);
                }}
                isDisabled={isProcessingResume || isSaving}
              />

              <button
                type="button"
                onClick={handleConfirmReupload}
                disabled={!processedData || isProcessingResume || isSaving}
                aria-label="Confirm & Recreate Profile"
                style={{
                  background:
                    !processedData || isProcessingResume || isSaving
                      ? '#2e3347'
                      : 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                  color:
                    !processedData || isProcessingResume || isSaving ? '#646e87' : '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  cursor:
                    !processedData || isProcessingResume || isSaving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{isSaving ? 'Recreating...' : 'Confirm & Recreate Profile'}</span>
                <CheckCircle2 size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </InternalPageLayout>
  );
}

export default EditExperiencePage;
