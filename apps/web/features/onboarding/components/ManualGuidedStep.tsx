'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import { ArrowRight, Check, Compass, Layers, Rocket, UserCheck } from 'lucide-react';
import type { CareerProfileData } from '../types';

interface ManualGuidedStepProps {
  initialData?: CareerProfileData;
  onSubmit: (data: CareerProfileData) => Promise<void> | void;
  onBackToUpload: () => void;
  isSubmitting?: boolean;
}

const COMMON_ROLES = [
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Engineer',
  'DevOps / SRE',
  'Data Engineer',
  'Mobile Developer',
  'QA / Automation Engineer',
  'Software Engineer',
];

const TARGET_ROLES = [
  'Cloud Solutions Architect',
  'AI / ML Platform Engineer',
  'Staff Software Engineer',
  'Site Reliability Engineer (SRE)',
  'DevOps & Platform Specialist',
  'Data Systems Architect',
  'Engineering Manager',
];

const POPULAR_SKILLS = [
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'Go',
  'Docker',
  'Kubernetes',
  'AWS',
  'PostgreSQL',
  'GraphQL',
  'System Design',
  'Kafka',
  'Terraform',
];

const EXPERIENCE_PRESETS = [
  { label: '1 - 2 yrs', value: '2' },
  { label: '3 - 5 yrs', value: '4' },
  { label: '6 - 9 yrs', value: '7' },
  { label: '10+ yrs', value: '10' },
];

const TIMELINE_PRESETS = [
  '3 - 6 Months',
  '6 - 12 Months',
  '1 - 2 Years',
  'Self-Paced Exploration',
];

export function ManualGuidedStep({
  initialData,
  onSubmit,
  onBackToUpload,
  isSubmitting = false,
}: ManualGuidedStepProps) {
  // 4 Interactive sections:
  // 1: Current Role & Seniority
  // 2: Technical Arsenal & Skills
  // 3: Target Career Horizon
  // 4: Professional Summary & Motivation
  const [section, setSection] = useState<1 | 2 | 3 | 4>(1);

  const [currentRole, setCurrentRole] = useState(initialData?.currentRole ?? '');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData?.yearsOfExperience ?? '',
  );
  const [skills, setSkills] = useState<string[]>(
    initialData?.skills && initialData.skills.length > 0
      ? initialData.skills
      : [],
  );
  const [newSkill, setNewSkill] = useState('');
  const [targetRole, setTargetRole] = useState(initialData?.targetRole ?? '');
  const [targetTimeline, setTargetTimeline] = useState('3 - 6 Months');
  const [summary, setSummary] = useState(initialData?.summary ?? '');

  const [error, setError] = useState<string | null>(null);

  // Section 1 Validation -> goes to Section 2 (Target Goal)
  const handleNextFromOrigin = () => {
    if (!currentRole.trim()) {
      setError('Please specify your current technical role to proceed.');
      return;
    }
    if (!yearsOfExperience.trim() || Number.isNaN(Number(yearsOfExperience))) {
      setError('Please enter a valid number of years of experience.');
      return;
    }
    setError(null);
    setSection(2);
  };

  // Section 2 Validation (Target Goal) -> goes to Section 3 (Skills)
  const handleNextFromTarget = () => {
    setError(null);
    setSection(3);
  };

  // Section 3 Validation (Skills) -> submits profile
  const handleNextFromSkills = () => {
    if (skills.length === 0) {
      setError('Please select or add at least one core skill.');
      return;
    }
    setError(null);
    handleFinalProceed();
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill('');
    if (error) setError(null);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleFinalProceed = () => {
    if (!currentRole.trim() || !yearsOfExperience.trim()) {
      setSection(1);
      setError('Current role and experience are required.');
      return;
    }

    const payload: CareerProfileData = {
      id: initialData?.id,
      currentRole: currentRole.trim(),
      yearsOfExperience: yearsOfExperience.trim(),
      targetRole: targetRole.trim() || 'Cloud Solutions Architect',
      skills: skills.length > 0 ? skills : ['TypeScript', 'React', 'Node.js'],
      summary:
        summary.trim() ||
        `${currentRole.trim()} with ${yearsOfExperience.trim()} years of experience aiming to transition to ${targetRole.trim() || 'target engineering role'} within ${targetTimeline}.`,
    };

    onSubmit(payload);
  };

  return (
    <VStack gap={5} width="100%" align="center">
      {/* Interactive Step Progress Header */}
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-periwinkle-glow, #98a4f7)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Section {section} of 4
            </span>
            <span style={{ color: 'var(--color-muted-steel, #646e87)' }}>•</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-frost, #c9d3ee)' }}>
              {section === 1 && 'Origin & Seniority'}
              {section === 2 && 'Skill Arsenal'}
              {section === 3 && 'Target Horizon'}
              {section === 4 && 'Career Focus & Summary'}
            </span>
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-steel, #646e87)' }}>
            {Math.round((section / 4) * 100)}% Complete
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            background: 'var(--color-gunmetal, #1f2433)',
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(section / 4) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #5b63d3, #98a4f7)',
              borderRadius: 9999,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div
          style={{
            width: '100%',
            maxWidth: 580,
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      {/* SECTION 1: Origin & Seniority */}
      {section === 1 && (
        <VStack gap={4} width="100%" style={{ maxWidth: 580 }}>
          <VStack gap={1} align="center" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
              <Heading level={2} weight="semibold">
                What is your current role &amp; background?
              </Heading>
            </div>
            <Text type="supporting" color="secondary">
              Let&apos;s establish your technical starting baseline.
            </Text>
          </VStack>

          <Card variant="default" elevation="none" style={{ padding: '24px' }}>
            <VStack gap={4}>
              <TextInput
                label="Current role *"
                value={currentRole}
                onChange={(val) => {
                  setCurrentRole(val);
                  if (error) setError(null);
                }}
                placeholder="e.g. Senior Frontend Engineer"
                isRequired
              />

              {/* Quick suggestion chips */}
              <VStack gap={1}>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                  Quick-select current role:
                </Text>
                <HStack gap={1} wrap="wrap">
                  {COMMON_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setCurrentRole(role);
                        if (error) setError(null);
                      }}
                      style={{
                        background:
                          currentRole === role
                            ? 'var(--color-carbon-surface, #151621)'
                            : 'transparent',
                        border:
                          currentRole === role
                            ? '1px solid var(--color-periwinkle-glow, #98a4f7)'
                            : '1px solid var(--color-gunmetal, #1f2433)',
                        color:
                          currentRole === role
                            ? 'var(--color-pure-white, #ffffff)'
                            : 'var(--color-frost, #c9d3ee)',
                        borderRadius: 9999,
                        padding: '5px 13px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </HStack>
              </VStack>

              {/* Experience Presets & Input */}
              <VStack gap={2}>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                  Years of professional engineering experience:
                </Text>
                <HStack gap={2} wrap="wrap">
                  {EXPERIENCE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setYearsOfExperience(preset.value);
                        if (error) setError(null);
                      }}
                      style={{
                        background:
                          yearsOfExperience === preset.value
                            ? 'var(--color-carbon-surface, #151621)'
                            : 'transparent',
                        border:
                          yearsOfExperience === preset.value
                            ? '1px solid var(--color-periwinkle-glow, #98a4f7)'
                            : '1px solid var(--color-gunmetal, #1f2433)',
                        color:
                          yearsOfExperience === preset.value
                            ? 'var(--color-pure-white, #ffffff)'
                            : 'var(--color-frost, #c9d3ee)',
                        borderRadius: 9999,
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </HStack>

                <TextInput
                  label="Years of experience *"
                  value={yearsOfExperience}
                  onChange={(val) => {
                    setYearsOfExperience(val);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 5"
                  isRequired
                />
              </VStack>
            </VStack>
          </Card>

          <HStack justify="between" width="100%">
            <Button label="← Back to upload" variant="ghost" onClick={onBackToUpload} />
            <button
              type="button"
              onClick={handleNextFromOrigin}
              style={{
                background: 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '9px 20px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Continue to Goal →</span>
              <ArrowRight size={15} />
            </button>
          </HStack>
        </VStack>
      )}

      {/* SECTION 2: Target Career Horizon */}
      {section === 2 && (
        <VStack gap={4} width="100%" style={{ maxWidth: 580 }}>
          <VStack gap={1} align="center" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={20} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
              <Heading level={2} weight="semibold">
                Where do you want to switch to?
              </Heading>
            </div>
            <Text type="supporting" color="secondary">
              Set your target role so we can calculate readiness benchmarks.
            </Text>
          </VStack>

          <Card variant="default" elevation="none" style={{ padding: '24px' }}>
            <VStack gap={4}>
              <TextInput
                label="Target role title"
                value={targetRole}
                onChange={setTargetRole}
                placeholder="e.g. Cloud Solutions Architect"
              />

              {/* Target Role Presets */}
              <VStack gap={1}>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                  Popular transition trajectories:
                </Text>
                <HStack gap={1} wrap="wrap">
                  {TARGET_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      style={{
                        background:
                          targetRole === role
                            ? 'var(--color-carbon-surface, #151621)'
                            : 'transparent',
                        border:
                          targetRole === role
                            ? '1px solid var(--color-periwinkle-glow, #98a4f7)'
                            : '1px solid var(--color-gunmetal, #1f2433)',
                        color:
                          targetRole === role
                            ? 'var(--color-pure-white, #ffffff)'
                            : 'var(--color-frost, #c9d3ee)',
                        borderRadius: 9999,
                        padding: '5px 13px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </HStack>
              </VStack>

              {/* Transition Timeline */}
              <VStack gap={1}>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                  Target transition timeframe:
                </Text>
                <HStack gap={1} wrap="wrap">
                  {TIMELINE_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetTimeline(t)}
                      style={{
                        background:
                          targetTimeline === t
                            ? 'var(--color-carbon-surface, #151621)'
                            : 'transparent',
                        border:
                          targetTimeline === t
                            ? '1px solid var(--color-periwinkle-glow, #98a4f7)'
                            : '1px solid var(--color-gunmetal, #1f2433)',
                        color:
                          targetTimeline === t
                            ? 'var(--color-pure-white, #ffffff)'
                            : 'var(--color-frost, #c9d3ee)',
                        borderRadius: 9999,
                        padding: '4px 12px',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <HStack justify="between" width="100%">
            <Button label="← Previous" variant="ghost" onClick={() => setSection(1)} />
            <button
              type="button"
              onClick={handleNextFromTarget}
              style={{
                background: 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '9px 20px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Continue to Skills →</span>
              <ArrowRight size={15} />
            </button>
          </HStack>
        </VStack>
      )}

      {/* SECTION 3: Technical Arsenal & Skills */}
      {section === 3 && (
        <VStack gap={4} width="100%" style={{ maxWidth: 580 }}>
          <VStack gap={1} align="center" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={20} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
              <Heading level={2} weight="semibold">
                What are your core technical skills?
              </Heading>
            </div>
            <Text type="supporting" color="secondary">
              Select or add the languages, frameworks, and infrastructure tools you use.
            </Text>
          </VStack>

          <Card variant="default" elevation="none" style={{ padding: '24px' }}>
            <VStack gap={4}>
              {/* Active Selected Skills */}
              <div
                style={{
                  minHeight: 48,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: 10,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                  borderRadius: 10,
                }}
              >
                {skills.map((skill) => (
                  <Token key={skill} label={skill} size="md" onRemove={() => handleRemoveSkill(skill)} />
                ))}
                {skills.length === 0 && (
                  <Text type="supporting" color="secondary">
                    No skills selected. Click popular badges below or type your own.
                  </Text>
                )}
              </div>

              {/* Add Custom Skill */}
              <HStack gap={2} align="end">
                <div style={{ flex: 1 }}>
                  <TextInput
                    label="Add custom technology or skill"
                    value={newSkill}
                    onChange={setNewSkill}
                    placeholder="e.g. Terraform, GraphQL, Rust"
                  />
                </div>
                <Button
                  label="Add"
                  variant="secondary"
                  onClick={() => handleAddSkill(newSkill)}
                  isDisabled={!newSkill.trim()}
                />
              </HStack>

              {/* Popular Skill Toggles */}
              <VStack gap={1}>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                  Tap to add popular competencies:
                </Text>
                <HStack gap={1} wrap="wrap">
                  {POPULAR_SKILLS.filter(
                    (p) => !skills.some((s) => s.toLowerCase() === p.toLowerCase()),
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleAddSkill(p)}
                      style={{
                        background: 'transparent',
                        border: '1px dashed var(--color-gunmetal, #1f2433)',
                        color: 'var(--color-frost, #c9d3ee)',
                        borderRadius: 9999,
                        padding: '4px 12px',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      + {p}
                    </button>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <HStack justify="between" width="100%">
            <Button label="← Previous" variant="ghost" onClick={() => setSection(2)} />
            <button
              type="button"
              id="proceed-to-dashboard-btn"
              onClick={handleNextFromSkills}
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 24px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{isSubmitting ? 'Saving...' : 'Lock Baseline & Go to Dashboard →'}</span>
              <Check size={16} />
            </button>
          </HStack>
        </VStack>
      )}

      {/* SECTION 4: Professional Summary & Motivation */}
      {section === 4 && (
        <VStack gap={4} width="100%" style={{ maxWidth: 580 }}>
          <VStack gap={1} align="center" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={20} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
              <Heading level={2} weight="semibold">
                Summary &amp; Career Focus
              </Heading>
            </div>
            <Text type="supporting" color="secondary">
              Add a brief highlight of your strengths or motivation for switching.
            </Text>
          </VStack>

          <Card variant="default" elevation="none" style={{ padding: '24px' }}>
            <VStack gap={4}>
              <TextArea
                label="Professional summary (Optional)"
                value={summary}
                onChange={setSummary}
                placeholder="e.g. Senior Frontend Engineer with 5 years experience building complex web apps. Looking to deepen distributed systems knowledge and transition into Cloud Architecture..."
                rows={3}
              />

              {/* Trajectory Blueprint Preview */}
              <div
                style={{
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                    Trajectory Blueprint Preview
                  </Text>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-green, #86EFAC)',
                      fontWeight: 500,
                    }}
                  >
                    Ready to lock
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-steel, #646e87)' }}>
                      Origin:
                    </span>{' '}
                    <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
                      {currentRole} ({yearsOfExperience} yrs)
                    </span>
                  </div>
                  <span style={{ color: 'var(--color-muted-steel, #646e87)' }}>➔</span>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-steel, #646e87)' }}>
                      Target:
                    </span>{' '}
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-periwinkle-glow, #98a4f7)', fontWeight: 500 }}>
                      {targetRole || 'Cloud Solutions Architect'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--color-frost, #c9d3ee)' }}>
                  Skills locked: {skills.join(', ')}
                </div>
              </div>
            </VStack>
          </Card>

          <HStack justify="between" width="100%">
            <Button label="← Previous" variant="ghost" onClick={() => setSection(3)} />
            
            {/* Final CTA matching wireframe: 'proceed' */}
            <button
              type="button"
              id="proceed-to-dashboard-btn"
              onClick={handleFinalProceed}
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 24px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{isSubmitting ? 'Saving...' : 'Proceed to Dashboard →'}</span>
              <Check size={16} />
            </button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
}
