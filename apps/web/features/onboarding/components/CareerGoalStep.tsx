'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';

interface CareerGoalStepProps {
  initialRole?: string;
  onSave: (targetRole: string) => void;
  onBack: () => void;
}

const SUGGESTED_ROLES = [
  'Full Stack Engineer',
  'Full Stack Developer',
  'Backend Engineer',
  'Cloud Platform Engineer',
  'AI / ML Engineer',
];

export function CareerGoalStep({
  initialRole = '',
  onSave,
  onBack,
}: CareerGoalStepProps) {
  const [targetRole, setTargetRole] = useState(initialRole);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSuggested = (role: string) => {
    setTargetRole(role);
    if (error) setError(null);
  };

  const handleSave = () => {
    if (!targetRole.trim()) {
      setError('Please select or specify your target career role.');
      return;
    }
    setError(null);
    onSave(targetRole.trim());
  };

  return (
    <VStack gap={5} width="100%">
      <VStack gap={1}>
        <Heading level={1} weight="semibold">
          Step 2: Set your career goal
        </Heading>
        <Text type="supporting" color="secondary">
          Where you want to go. Select or enter the role you are transitioning toward.
        </Text>
      </VStack>

      <VStack gap={4}>
        <TextInput
          label="Target Role *"
          placeholder="e.g. Full Stack Engineer"
          value={targetRole}
          onChange={(val) => {
            setTargetRole(val);
            if (error) setError(null);
          }}
          status={error ? { type: 'error', message: error } : undefined}
          isRequired
        />

        <VStack gap={2}>
          <Text type="supporting" weight="medium">
            Suggested roles:
          </Text>
          <HStack gap={2} wrap="wrap">
            {SUGGESTED_ROLES.map((role) => {
              const isSelected = targetRole === role;
              return (
                <Button
                  key={role}
                  label={role}
                  variant={isSelected ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleSelectSuggested(role)}
                />
              );
            })}
          </HStack>
        </VStack>

        <Card variant="muted" elevation="none" padding={3}>
          <Text type="supporting" color="secondary">
            💡 The target role determines the skill requirements and actionable milestone roadmap created for you in the next stage.
          </Text>
        </Card>
      </VStack>

      <HStack justify="between" align="center" width="100%" paddingBlockStart={4}>
        <Button label="← Back to Baseline" variant="ghost" onClick={onBack} />
        <Button label="Save Profile & Goal →" variant="primary" onClick={handleSave} />
      </HStack>
    </VStack>
  );
}
