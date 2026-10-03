'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import type { CareerProfileData } from '../types';

interface ManualEntryStepProps {
  initialData?: Partial<CareerProfileData>;
  onContinue: (data: CareerProfileData) => void;
  onBack: () => void;
}

export function ManualEntryStep({
  initialData,
  onContinue,
  onBack,
}: ManualEntryStepProps) {
  const [currentRole, setCurrentRole] = useState(initialData?.currentRole ?? '');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData?.yearsOfExperience ?? '',
  );
  const [skills, setSkills] = useState<string[]>(
    initialData?.skills?.length ? initialData.skills : ['React', 'JavaScript'],
  );
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
      currentRole: currentRole.trim(),
      yearsOfExperience: yearsOfExperience.trim(),
      skills,
      summary: initialData?.summary ?? '',
      targetRole: initialData?.targetRole ?? '',
      source: 'manual',
    });
  };

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

      <VStack gap={4}>
        <TextInput
          label="Current Role *"
          placeholder="e.g. Frontend Developer"
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
          placeholder="e.g. 3.0"
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
            Key Skills *
          </Text>
          <HStack gap={2} wrap="wrap">
            {skills.map((skill) => (
              <Token
                key={skill}
                label={skill}
                color="blue"
                onRemove={() => handleRemoveSkill(skill)}
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
            />
            <Button
              label="+ Add"
              variant="secondary"
              size="md"
              onClick={handleAddSkill}
            />
          </HStack>
        </VStack>
      </VStack>

      <HStack justify="between" align="center" width="100%" paddingBlockStart={4}>
        <Button label="← Back to Upload" variant="ghost" onClick={onBack} />
        <Button label="Continue to Goal →" variant="primary" onClick={handleContinue} />
      </HStack>
    </VStack>
  );
}
