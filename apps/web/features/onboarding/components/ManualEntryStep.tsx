'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import type { CareerProfileData } from '../types';

interface ManualEntryStepProps {
  initialData?: Partial<CareerProfileData>;
  onContinue: (data: CareerProfileData) => void;
  onBack: () => void;
  isSaving?: boolean;
  isLoadingExisting?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  isSubmissionAllowed?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function ManualEntryStep({
  initialData,
  onContinue,
  onBack,
  isSaving = false,
  isLoadingExisting = false,
  loadError = null,
  onRetryLoad,
  isSubmissionAllowed = true,
  errorMessage = null,
  onClearError,
}: ManualEntryStepProps) {
  const [currentRole, setCurrentRole] = useState(initialData?.currentRole ?? '');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData?.yearsOfExperience ?? '',
  );
  const [skills, setSkills] = useState<string[]>(
    initialData?.skills?.length ? initialData.skills : [],
  );
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [targetRole, setTargetRole] = useState(initialData?.targetRole ?? '');
  const [newSkill, setNewSkill] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [expError, setExpError] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkill('');
      if (onClearError) onClearError();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    if (onClearError) onClearError();
  };

  const handleContinue = () => {
    if (!isSubmissionAllowed || loadError) return;

    let hasError = false;
    if (!currentRole.trim()) {
      setRoleError('Current role is required');
      hasError = true;
    } else {
      setRoleError(null);
    }

    const trimmedExp = yearsOfExperience.trim();
    // Enforce decimal precision: non-negative integer or with at most one decimal place (e.g. 3 or 3.5)
    const EXP_ONE_DECIMAL_REGEX = /^\d+(\.\d)?$/;
    if (!trimmedExp) {
      setExpError('Years of experience is required');
      hasError = true;
    } else if (!EXP_ONE_DECIMAL_REGEX.test(trimmedExp)) {
      setExpError(
        'Years of experience must be a non-negative number with at most one decimal place (e.g. 3 or 3.5)',
      );
      hasError = true;
    } else {
      setExpError(null);
    }

    if (hasError) return;

    if (onClearError) onClearError();

    onContinue({
      id: initialData?.id,
      currentRole: currentRole.trim(),
      yearsOfExperience: trimmedExp,
      skills,
      summary: summary.trim(),
      targetRole: targetRole.trim() || undefined,
    });
  };

  const isFormDisabled = isSaving || isLoadingExisting || Boolean(loadError);

  return (
    <VStack gap={5} width="100%">
      <VStack gap={1}>
        <Heading level={1} weight="semibold">
          Build your career profile manually
        </Heading>
        <Text type="supporting" color="secondary">
          Tell us about where you are in your career today.
        </Text>
      </VStack>

      {isLoadingExisting && (
        <Card variant="cyan" elevation="none">
          <HStack gap={3} align="center" padding={3}>
            <StatusDot variant="accent" label="Loading" isPulsing />
            <Text type="supporting" style={{ color: 'var(--color-text-cyan)' }}>
              Checking for existing career profile...
            </Text>
          </HStack>
        </Card>
      )}

      {loadError && (
        <Card variant="red" elevation="none">
          <VStack gap={3} padding={4}>
            <HStack gap={2} align="center">
              <StatusDot variant="error" label="Error" />
              <Heading level={4} weight="medium" style={{ color: 'var(--color-text-red)' }}>
                Could not verify existing profile status
              </Heading>
            </HStack>
            <Text type="supporting" style={{ color: 'var(--color-text-red)' }}>
              {loadError}
            </Text>
            {onRetryLoad && (
              <HStack gap={2} paddingBlockStart={1}>
                <Button
                  label="Retry check"
                  variant="secondary"
                  size="sm"
                  onClick={onRetryLoad}
                />
              </HStack>
            )}
          </VStack>
        </Card>
      )}

      {errorMessage && (
        <Card variant="red" elevation="none">
          <VStack gap={2} padding={4}>
            <HStack gap={2} align="center">
              <StatusDot variant="error" label="Error" />
              <Heading level={4} weight="medium" style={{ color: 'var(--color-text-red)' }}>
                Could not save profile
              </Heading>
            </HStack>
            <Text type="supporting" style={{ color: 'var(--color-text-red)' }}>
              {errorMessage}
            </Text>
          </VStack>
        </Card>
      )}

      <VStack gap={4}>
        <TextInput
          label="Current Role *"
          placeholder="e.g. Software Engineer"
          value={currentRole}
          onChange={(val) => {
            setCurrentRole(val);
            if (roleError) setRoleError(null);
            if (onClearError) onClearError();
          }}
          status={roleError ? { type: 'error', message: roleError } : undefined}
          isDisabled={isFormDisabled}
          isRequired
        />

        <TextInput
          label="Years of Experience *"
          placeholder="e.g. 3.0"
          value={yearsOfExperience}
          onChange={(val) => {
            setYearsOfExperience(val);
            if (expError) setExpError(null);
            if (onClearError) onClearError();
          }}
          status={expError ? { type: 'error', message: expError } : undefined}
          isDisabled={isFormDisabled}
          isRequired
        />

        <TextInput
          label="Target Role"
          placeholder="e.g. Full Stack Engineer (optional)"
          value={targetRole}
          onChange={(val) => {
            setTargetRole(val);
            if (onClearError) onClearError();
          }}
          isDisabled={isFormDisabled}
        />

        <TextInput
          label="Professional Summary"
          placeholder="e.g. 5 years building scalable web systems (optional)"
          value={summary}
          onChange={(val) => {
            setSummary(val);
            if (onClearError) onClearError();
          }}
          isDisabled={isFormDisabled}
        />

        <VStack gap={2}>
          <Text type="label" weight="medium">
            Key Skills *
          </Text>
          <HStack gap={2} wrap="wrap">
            {skills.map((skill) => (
              <Token
                key={skill}
                label={skill}
                color="blue"
                onRemove={isFormDisabled ? undefined : () => handleRemoveSkill(skill)}
              />
            ))}
          </HStack>

          <HStack gap={2} align="center">
            <TextInput
              label="Add a technical skill"
              isLabelHidden
              placeholder="e.g. Node.js, Python"
              value={newSkill}
              onChange={setNewSkill}
              onEnter={handleAddSkill}
              isDisabled={isFormDisabled}
            />
            <Button
              label="+ Add"
              variant="secondary"
              size="md"
              onClick={handleAddSkill}
              isDisabled={isFormDisabled || !newSkill.trim()}
            />
          </HStack>
        </VStack>
      </VStack>

      <HStack justify="between" align="center" width="100%" paddingBlockStart={4}>
        <Button
          label="← Back to Upload"
          variant="ghost"
          onClick={onBack}
          isDisabled={isSaving}
        />
        <Button
          label={isSaving ? 'Saving...' : 'Continue to Goal →'}
          variant="primary"
          onClick={handleContinue}
          isDisabled={isSaving || isLoadingExisting || Boolean(loadError) || !isSubmissionAllowed}
        />
      </HStack>
    </VStack>
  );
}
