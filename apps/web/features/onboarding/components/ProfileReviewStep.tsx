'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import type { CareerProfileData } from '../types';

interface ProfileReviewStepProps {
  initialData: CareerProfileData;
  onContinue: (updated: CareerProfileData) => void;
  onReupload: () => void;
}

export function ProfileReviewStep({
  initialData,
  onContinue,
  onReupload,
}: ProfileReviewStepProps) {
  const [currentRole, setCurrentRole] = useState(initialData.currentRole);
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData.yearsOfExperience,
  );
  const [skills, setSkills] = useState<string[]>(initialData.skills);
  const [summary, setSummary] = useState(initialData.summary);
  const [newSkill, setNewSkill] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [expError, setExpError] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleContinue = () => {
    let hasError = false;
    if (!currentRole.trim()) {
      setRoleError('Current role is required');
      hasError = true;
    } else {
      setRoleError(null);
    }

    if (!yearsOfExperience.trim()) {
      setExpError('Years of experience is required');
      hasError = true;
    } else {
      setExpError(null);
    }

    if (hasError) return;

    onContinue({
      ...initialData,
      currentRole: currentRole.trim(),
      yearsOfExperience: yearsOfExperience.trim(),
      skills,
      summary: summary.trim(),
    });
  };

  return (
    <VStack gap={5} width="100%">
      <VStack gap={1}>
        <Heading level={1} weight="semibold">
          Step 1: Verify your career baseline
        </Heading>
        <Text type="supporting" color="secondary">
          Where you are today. Review and adjust extracted details before continuing.
        </Text>
      </VStack>

      {/* AI Provenance Notice - Cyan */}
      <Card variant="cyan" elevation="none" padding={3}>
        <HStack gap={2} align="center">
          <StatusDot variant="accent" label="AI Extracted" />
          <Text type="supporting" weight="medium" style={{ color: 'var(--color-text-cyan)' }}>
            ✨ Extracted from your resume with AI — please verify accuracy.
          </Text>
        </HStack>
      </Card>

      <VStack gap={4}>
        <TextInput
          label="Current Role *"
          value={currentRole}
          onChange={(val) => {
            setCurrentRole(val);
            if (roleError) setRoleError(null);
          }}
          status={roleError ? { type: 'error', message: roleError } : undefined}
          isRequired
        />

        <TextInput
          label="Years of Experience *"
          value={yearsOfExperience}
          onChange={(val) => {
            setYearsOfExperience(val);
            if (expError) setExpError(null);
          }}
          status={expError ? { type: 'error', message: expError } : undefined}
          isRequired
        />

        <VStack gap={2}>
          <Text type="label" weight="medium">
            Identified Skills *
          </Text>
          <HStack gap={2} wrap="wrap">
            {skills.map((skill) => (
              <Token
                key={skill}
                label={skill}
                color="cyan"
                onRemove={() => handleRemoveSkill(skill)}
              />
            ))}
          </HStack>

          <HStack gap={2} align="center">
            <TextInput
              label="Add a technical skill"
              isLabelHidden
              placeholder="e.g. Docker, GraphQL"
              value={newSkill}
              onChange={setNewSkill}
              onEnter={handleAddSkill}
            />
            <Button
              label="+ Add"
              variant="secondary"
              size="md"
              onClick={handleAddSkill}
            />
          </HStack>
        </VStack>

        <TextArea
          label="Career Summary (Optional)"
          value={summary}
          onChange={setSummary}
          placeholder="Brief summary of your background and core technical focus."
          rows={3}
        />
      </VStack>

      <HStack justify="between" align="center" width="100%" paddingBlockStart={4}>
        <Button label="← Re-upload resume" variant="ghost" onClick={onReupload} />
        <Button label="Continue to Goal →" variant="primary" onClick={handleContinue} />
      </HStack>
    </VStack>
  );
}
