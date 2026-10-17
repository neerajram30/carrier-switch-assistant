'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import type {
  CareerProfileData,
  EducationItem,
  ExtractedCareerData,
  ProjectItem,
  WorkExperienceItem,
} from '../types';

interface ExtractedDataReviewStepProps {
  initialData: ExtractedCareerData;
  onConfirm: (
    profileData: CareerProfileData,
    fullData: ExtractedCareerData,
  ) => Promise<void> | void;
  onBack: () => void;
  onSwitchToManual?: () => void;
  isSaving?: boolean;
  saveError?: string | null;
  onClearError?: () => void;
}

const EXP_ONE_DECIMAL_REGEX = /^\d+(\.\d)?$/;

export function ExtractedDataReviewStep({
  initialData,
  onConfirm,
  onBack,
  onSwitchToManual,
  isSaving = false,
  saveError = null,
  onClearError,
}: ExtractedDataReviewStepProps) {
  // 1. Role & Experience (Core profile)
  const [currentRole, setCurrentRole] = useState(initialData.currentRole ?? '');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData.yearsOfExperience !== null &&
      initialData.yearsOfExperience !== undefined
      ? String(initialData.yearsOfExperience)
      : '',
  );
  const [targetRole, setTargetRole] = useState('');
  const [summary, setSummary] = useState(
    initialData.workExperience?.[0]?.description ?? '',
  );

  // 2. Technical Skills
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');

  // 3. Work Experience
  const [workExperience, setWorkExperience] = useState<WorkExperienceItem[]>(
    initialData.workExperience || [],
  );

  // 4. Projects
  const [projects, setProjects] = useState<ProjectItem[]>(
    initialData.projects || [],
  );

  // 5. Education
  const [education, setEducation] = useState<EducationItem[]>(
    initialData.education || [],
  );

  // Validation errors
  const [roleError, setRoleError] = useState<string | null>(null);
  const [expError, setExpError] = useState<string | null>(null);

  // Temporary inputs for new items
  const [showAddWork, setShowAddWork] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDates, setNewDates] = useState('');
  const [newWorkDesc, setNewWorkDesc] = useState('');

  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');

  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newInstitution, setNewInstitution] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [newGradYear, setNewGradYear] = useState('');

  // Skills management
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
      onClearError?.();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    onClearError?.();
  };

  // Work experience management
  const handleAddWorkExperience = () => {
    if (!newCompany.trim() && !newRole.trim()) return;
    setWorkExperience((prev) => [
      ...prev,
      {
        company: newCompany.trim() || null,
        role: newRole.trim() || null,
        startDate: newDates.trim() || null,
        endDate: null,
        description: newWorkDesc.trim() || null,
      },
    ]);
    setNewCompany('');
    setNewRole('');
    setNewDates('');
    setNewWorkDesc('');
    setShowAddWork(false);
  };

  const handleRemoveWork = (index: number) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // Projects management
  const handleAddProject = () => {
    if (!newProjName.trim()) return;
    const techs = newProjTech
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setProjects((prev) => [
      ...prev,
      {
        name: newProjName.trim(),
        description: newProjDesc.trim() || null,
        technologies: techs,
      },
    ]);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
    setShowAddProject(false);
  };

  const handleRemoveProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  // Education management
  const handleAddEducation = () => {
    if (!newInstitution.trim() && !newQualification.trim()) return;
    const yearParsed = newGradYear ? Number.parseInt(newGradYear, 10) : null;
    setEducation((prev) => [
      ...prev,
      {
        institution: newInstitution.trim() || null,
        qualification: newQualification.trim() || null,
        graduationYear:
          yearParsed && !Number.isNaN(yearParsed) ? yearParsed : null,
      },
    ]);
    setNewInstitution('');
    setNewQualification('');
    setNewGradYear('');
    setShowAddEdu(false);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm and proceed
  const handleConfirm = async () => {
    let hasError = false;

    if (!currentRole.trim()) {
      setRoleError('Current role is required to establish your career baseline.');
      hasError = true;
    } else {
      setRoleError(null);
    }

    const trimmedExp = yearsOfExperience.trim();
    if (!trimmedExp) {
      setExpError('Years of experience is required.');
      hasError = true;
    } else if (!EXP_ONE_DECIMAL_REGEX.test(trimmedExp)) {
      setExpError('Please enter a valid number (e.g. 3 or 3.5).');
      hasError = true;
    } else {
      const num = Number.parseFloat(trimmedExp);
      if (num < 0 || num > 50) {
        setExpError('Experience must be between 0 and 50 years.');
        hasError = true;
      } else {
        setExpError(null);
      }
    }

    if (hasError) return;

    const confirmedProfile: CareerProfileData = {
      currentRole: currentRole.trim(),
      yearsOfExperience: trimmedExp,
      skills,
      summary: summary.trim(),
      targetRole: targetRole.trim() || undefined,
    };

    const fullReviewedData: ExtractedCareerData = {
      name: initialData.name,
      currentRole: currentRole.trim(),
      yearsOfExperience: Number.parseFloat(trimmedExp),
      skills,
      workExperience,
      projects,
      education,
    };

    await onConfirm(confirmedProfile, fullReviewedData);
  };

  // Determine incomplete sections for user guidance
  const isIncompleteRole = !currentRole.trim();
  const isIncompleteExp = !yearsOfExperience.trim();
  const isIncompleteSkills = skills.length === 0;
  const hasIncompleteItems =
    isIncompleteRole || isIncompleteExp || isIncompleteSkills;

  return (
    <VStack gap={6} width="100%">
      {/* Step Header */}
      <VStack gap={2}>
        <Heading level={1} weight="semibold">
          Review extracted career data
        </Heading>
        <Text type="supporting" color="secondary">
          We&apos;ve extracted this information from your resume. Review, correct,
          or enrich the details below to power your personalized career plan.
        </Text>
      </VStack>

      {/* Task 3.3: Incomplete Section Alert / Helper notice */}
      {hasIncompleteItems && (
        <Card variant="cyan" elevation="none">
          <VStack gap={2} padding={3}>
            <HStack gap={2} align="center">
              <StatusDot variant="accent" label="Notice" />
              <Heading
                level={4}
                weight="medium"
                style={{ color: 'var(--color-text-cyan)' }}
              >
                Some sections need your attention
              </Heading>
            </HStack>
            <Text type="supporting" style={{ color: 'var(--color-text-cyan)' }}>
              {isIncompleteRole && isIncompleteExp
                ? 'Your role and years of experience were not clearly detected. Please verify or enter them below.'
                : isIncompleteRole
                  ? 'Your current role was not detected. Please specify your role.'
                  : isIncompleteExp
                    ? 'Your years of experience were not detected. Please specify your approximate experience.'
                    : 'No skills were detected. Add your key technical skills below.'}
            </Text>
          </VStack>
        </Card>
      )}

      {/* Heuristic Extraction Notice when rule-based fallback was used */}
      {(initialData.extractionMethod === 'heuristic' ||
        initialData.warnings?.some((w) =>
          w.toLowerCase().includes('heuristic'),
        )) && (
        <Card variant="default" elevation="none">
          <VStack gap={1} padding={3}>
            <HStack gap={2} align="center">
              <StatusDot variant="neutral" label="Heuristic extraction notice" />
              <Heading level={4} weight="medium">
                Heuristic extraction used
              </Heading>
            </HStack>
            <Text type="supporting" color="secondary">
              Core skills and role were extracted using rule-based parsing because AI extraction was unavailable. Work experience, projects, and education were not automatically populated—please review and fill them in manually below.
            </Text>
          </VStack>
        </Card>
      )}

      {/* Error alert when save/confirmation fails (Task 3.3: Preserves edits) */}
      {saveError && (
        <Card variant="red" elevation="none">
          <VStack gap={2} padding={3}>
            <HStack gap={2} align="center">
              <StatusDot variant="error" label="Save Error" />
              <Heading
                level={4}
                weight="medium"
                style={{ color: 'var(--color-text-red)' }}
              >
                Failed to save career profile
              </Heading>
            </HStack>
            <Text type="body" style={{ color: 'var(--color-text-red)' }}>
              {saveError}
            </Text>
            <Text type="supporting" color="secondary">
              Your edits have been preserved. You can retry confirming below.
            </Text>
          </VStack>
        </Card>
      )}

      {/* SECTION 1: Current Role & Experience */}
      <Card variant="default" elevation="none">
        <VStack gap={4} padding={4}>
          <Heading level={3} weight="medium">
            Current role & experience
          </Heading>

          <TextInput
            label="Current role *"
            value={currentRole}
            onChange={(val) => {
              setCurrentRole(val);
              if (roleError) setRoleError(null);
              onClearError?.();
            }}
            placeholder="e.g. Senior Frontend Engineer"
            isRequired
            status={roleError ? { type: 'error', message: roleError } : undefined}
          />

          <TextInput
            label="Years of experience *"
            value={yearsOfExperience}
            onChange={(val) => {
              setYearsOfExperience(val);
              if (expError) setExpError(null);
              onClearError?.();
            }}
            placeholder="e.g. 5 or 3.5"
            isRequired
            status={expError ? { type: 'error', message: expError } : undefined}
          />

          <TextInput
            label="Target role (Optional)"
            value={targetRole}
            onChange={(val) => {
              setTargetRole(val);
              onClearError?.();
            }}
            placeholder="e.g. Cloud Architect, Staff Engineer"
            isOptional
          />
        </VStack>
      </Card>

      {/* SECTION 2: Professional Summary */}
      <Card variant="default" elevation="none">
        <VStack gap={3} padding={4}>
          <Heading level={3} weight="medium">
            Professional summary
          </Heading>
          <TextArea
            label="Summary"
            value={summary}
            onChange={(val) => {
              setSummary(val);
              onClearError?.();
            }}
            placeholder="Brief summary of your technical background, leadership, or career achievements..."
            rows={3}
            isOptional
          />
        </VStack>
      </Card>

      {/* SECTION 3: Technical Skills */}
      <Card variant="default" elevation="none">
        <VStack gap={4} padding={4}>
          <HStack justify="between" align="center">
            <Heading level={3} weight="medium">
              Technical skills ({skills.length})
            </Heading>
            <Text type="supporting" color="secondary">
              Click &times; to remove incorrect skills
            </Text>
          </HStack>

          <HStack gap={2} wrap="wrap">
            {skills.map((skill) => (
              <Token
                key={skill}
                label={skill}
                size="md"
                onRemove={() => handleRemoveSkill(skill)}
              />
            ))}
            {skills.length === 0 && (
              <Text type="supporting" color="secondary">
                No skills detected yet. Add your primary technical skills below.
              </Text>
            )}
          </HStack>

          <HStack gap={2} align="end">
            <TextInput
              label="Add a skill"
              value={newSkillInput}
              onChange={setNewSkillInput}
              placeholder="e.g. Docker, TypeScript, Go"
            />
            <Button
              label="Add skill"
              variant="secondary"
              onClick={handleAddSkill}
              isDisabled={!newSkillInput.trim()}
            />
          </HStack>
        </VStack>
      </Card>

      {/* SECTION 4: Work Experience */}
      <Card variant="default" elevation="none">
        <VStack gap={4} padding={4}>
          <HStack justify="between" align="center">
            <Heading level={3} weight="medium">
              Work experience ({workExperience.length})
            </Heading>
            {!showAddWork && (
              <Button
                label="+ Add experience"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddWork(true)}
              />
            )}
          </HStack>

          {workExperience.map((exp, idx) => (
            <Card key={idx} variant="default" elevation="none">
              <VStack gap={2} padding={3}>
                <HStack justify="between" align="start">
                  <VStack gap={1}>
                    <Text type="body" weight="semibold">
                      {exp.role || 'Role unspecified'}
                      {exp.company ? ` at ${exp.company}` : ''}
                    </Text>
                    {exp.startDate && (
                      <Text type="supporting" color="secondary">
                        {exp.startDate}
                        {exp.endDate ? ` - ${exp.endDate}` : ''}
                      </Text>
                    )}
                  </VStack>
                  <Button
                    label="Remove"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWork(idx)}
                  />
                </HStack>
                {exp.description && (
                  <Text type="supporting" color="secondary">
                    {exp.description}
                  </Text>
                )}
              </VStack>
            </Card>
          ))}

          {workExperience.length === 0 && !showAddWork && (
            <Text type="supporting" color="secondary">
              No previous work experience extracted. You can add positions or skip
              this section.
            </Text>
          )}

          {showAddWork && (
            <Card variant="cyan" elevation="none">
              <VStack gap={3} padding={3}>
                <Heading level={4} weight="medium">
                  Add work experience
                </Heading>
                <TextInput
                  label="Company"
                  value={newCompany}
                  onChange={setNewCompany}
                  placeholder="e.g. Acme Tech"
                />
                <TextInput
                  label="Role / Title"
                  value={newRole}
                  onChange={setNewRole}
                  placeholder="e.g. Senior Software Engineer"
                />
                <TextInput
                  label="Dates"
                  value={newDates}
                  onChange={setNewDates}
                  placeholder="e.g. 2021 - 2024"
                />
                <TextArea
                  label="Description"
                  value={newWorkDesc}
                  onChange={setNewWorkDesc}
                  placeholder="Key responsibilities and achievements..."
                  rows={2}
                />
                <HStack gap={2} justify="end">
                  <Button
                    label="Cancel"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddWork(false)}
                  />
                  <Button
                    label="Save entry"
                    variant="primary"
                    size="sm"
                    onClick={handleAddWorkExperience}
                    isDisabled={!newCompany.trim() && !newRole.trim()}
                  />
                </HStack>
              </VStack>
            </Card>
          )}
        </VStack>
      </Card>

      {/* SECTION 5: Projects */}
      <Card variant="default" elevation="none">
        <VStack gap={4} padding={4}>
          <HStack justify="between" align="center">
            <Heading level={3} weight="medium">
              Projects ({projects.length})
            </Heading>
            {!showAddProject && (
              <Button
                label="+ Add project"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddProject(true)}
              />
            )}
          </HStack>

          {projects.map((proj, idx) => (
            <Card key={idx} variant="default" elevation="none">
              <VStack gap={2} padding={3}>
                <HStack justify="between" align="start">
                  <Text type="body" weight="semibold">
                    {proj.name || 'Untitled Project'}
                  </Text>
                  <Button
                    label="Remove"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProject(idx)}
                  />
                </HStack>
                {proj.description && (
                  <Text type="supporting" color="secondary">
                    {proj.description}
                  </Text>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <HStack gap={1} wrap="wrap">
                    {proj.technologies.map((tech) => (
                      <Token key={tech} label={tech} size="sm" />
                    ))}
                  </HStack>
                )}
              </VStack>
            </Card>
          ))}

          {projects.length === 0 && !showAddProject && (
            <Text type="supporting" color="secondary">
              No technical projects detected. You can add personal or open source
              projects here or skip.
            </Text>
          )}

          {showAddProject && (
            <Card variant="cyan" elevation="none">
              <VStack gap={3} padding={3}>
                <Heading level={4} weight="medium">
                  Add project
                </Heading>
                <TextInput
                  label="Project name"
                  value={newProjName}
                  onChange={setNewProjName}
                  placeholder="e.g. Cloud Storage CLI"
                />
                <TextArea
                  label="Description"
                  value={newProjDesc}
                  onChange={setNewProjDesc}
                  placeholder="What this project does and architectural highlights..."
                  rows={2}
                />
                <TextInput
                  label="Technologies (comma separated)"
                  value={newProjTech}
                  onChange={setNewProjTech}
                  placeholder="e.g. Go, AWS S3, gRPC"
                />
                <HStack gap={2} justify="end">
                  <Button
                    label="Cancel"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddProject(false)}
                  />
                  <Button
                    label="Save project"
                    variant="primary"
                    size="sm"
                    onClick={handleAddProject}
                    isDisabled={!newProjName.trim()}
                  />
                </HStack>
              </VStack>
            </Card>
          )}
        </VStack>
      </Card>

      {/* SECTION 6: Education */}
      <Card variant="default" elevation="none">
        <VStack gap={4} padding={4}>
          <HStack justify="between" align="center">
            <Heading level={3} weight="medium">
              Education & certifications ({education.length})
            </Heading>
            {!showAddEdu && (
              <Button
                label="+ Add education"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddEdu(true)}
              />
            )}
          </HStack>

          {education.map((edu, idx) => (
            <Card key={idx} variant="default" elevation="none">
              <VStack gap={1} padding={3}>
                <HStack justify="between" align="start">
                  <VStack gap={1}>
                    <Text type="body" weight="semibold">
                      {edu.qualification || 'Degree / Certificate'}
                    </Text>
                    <Text type="supporting" color="secondary">
                      {edu.institution || 'Institution'}
                      {edu.graduationYear ? ` • ${edu.graduationYear}` : ''}
                    </Text>
                  </VStack>
                  <Button
                    label="Remove"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEducation(idx)}
                  />
                </HStack>
              </VStack>
            </Card>
          ))}

          {education.length === 0 && !showAddEdu && (
            <Text type="supporting" color="secondary">
              No education history detected. You can add degrees or certifications
              here or skip.
            </Text>
          )}

          {showAddEdu && (
            <Card variant="cyan" elevation="none">
              <VStack gap={3} padding={3}>
                <Heading level={4} weight="medium">
                  Add education
                </Heading>
                <TextInput
                  label="Institution"
                  value={newInstitution}
                  onChange={setNewInstitution}
                  placeholder="e.g. Stanford University"
                />
                <TextInput
                  label="Degree / Qualification"
                  value={newQualification}
                  onChange={setNewQualification}
                  placeholder="e.g. B.S. in Computer Science"
                />
                <TextInput
                  label="Graduation Year"
                  value={newGradYear}
                  onChange={setNewGradYear}
                  placeholder="e.g. 2020"
                />
                <HStack gap={2} justify="end">
                  <Button
                    label="Cancel"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddEdu(false)}
                  />
                  <Button
                    label="Save education"
                    variant="primary"
                    size="sm"
                    onClick={handleAddEducation}
                    isDisabled={!newInstitution.trim() && !newQualification.trim()}
                  />
                </HStack>
              </VStack>
            </Card>
          )}
        </VStack>
      </Card>

      <Divider />

      {/* Confirmation Actions */}
      <HStack justify="between" align="center" width="100%">
        <Button
          label="← Back to upload"
          variant="secondary"
          onClick={onBack}
          isDisabled={isSaving}
        />
        <HStack gap={3}>
          {onSwitchToManual && (
            <Button
              label="Switch to manual form"
              variant="ghost"
              onClick={onSwitchToManual}
              isDisabled={isSaving}
            />
          )}
          <Button
            label={isSaving ? 'Saving profile...' : 'Confirm & Save Profile →'}
            variant="primary"
            onClick={() => void handleConfirm()}
            isDisabled={isSaving}
          />
        </HStack>
      </HStack>
    </VStack>
  );
}
