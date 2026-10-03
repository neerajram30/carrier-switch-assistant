'use client';

import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';

interface OnboardingHeaderProps {
  currentStep?: 1 | 2 | null;
}

export function OnboardingHeader({ currentStep = null }: OnboardingHeaderProps) {
  return (
    <HStack justify="between" align="center" width="100%" paddingBlock={2}>
      <Heading level={2} weight="semibold">
        Career Switch Assistant
      </Heading>

      {currentStep !== null && (
        <HStack gap={2} align="center">
          <Text
            type="label"
            weight={currentStep === 1 ? 'bold' : 'normal'}
            color={currentStep === 1 ? 'primary' : 'secondary'}
          >
            {currentStep === 1 ? '●' : '○'}
          </Text>
          <Text type="supporting" color="secondary">
            ─────
          </Text>
          <Text
            type="label"
            weight={currentStep === 2 ? 'bold' : 'normal'}
            color={currentStep === 2 ? 'primary' : 'secondary'}
          >
            {currentStep === 2 ? '●' : '○'}
          </Text>
        </HStack>
      )}
    </HStack>
  );
}
