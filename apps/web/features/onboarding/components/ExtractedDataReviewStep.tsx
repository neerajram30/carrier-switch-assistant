"use client";

import { useMemo, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  FolderGit2,
  Layers,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { TrajectoryStrengthGauge } from "./TrajectoryStrengthGauge";
import type {
  CareerProfileData,
  EducationItem,
  ExtractedCareerData,
  ProjectItem,
  WorkExperienceItem,
} from "../types";

const SUGGESTED_SKILLS_POOL = [
  "TypeScript",
  "React",
  "Node.js",
  "Next.js",
  "Go",
  "Python",
  "Docker",
  "Kubernetes",
  "AWS",
  "PostgreSQL",
  "GraphQL",
  "System Design",
];

interface ExtractedDataReviewStepProps {
  hideBottomBar?: boolean;
  hideTopHeader?: boolean;
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
  hideBottomBar = false,
  hideTopHeader = false,
}: ExtractedDataReviewStepProps) {
  // 1. Core Profile
  const [currentRole, setCurrentRole] = useState(initialData.currentRole ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData.yearsOfExperience !== null &&
      initialData.yearsOfExperience !== undefined
      ? String(initialData.yearsOfExperience)
      : "",
  );
  const [targetRole, setTargetRole] = useState(initialData.targetRole ?? "");
  const [summary, setSummary] = useState(
    initialData.summary || initialData.workExperience?.[0]?.description || "",
  );

  // 2. Technical Skills
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [newSkillInput, setNewSkillInput] = useState("");

  const suggestedSkills = useMemo(() => {
    const currentLower = new Set(skills.map((s) => s.toLowerCase()));
    return SUGGESTED_SKILLS_POOL.filter(
      (s) => !currentLower.has(s.toLowerCase()),
    ).slice(0, 5);
  }, [skills]);

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

  // Synchronize component state whenever initialData updates from asynchronous load
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData.currentRole) setCurrentRole(initialData.currentRole);
    if (
      initialData.yearsOfExperience !== null &&
      initialData.yearsOfExperience !== undefined
    ) {
      setYearsOfExperience(String(initialData.yearsOfExperience));
    }
    if (initialData.targetRole) setTargetRole(initialData.targetRole);
    if (initialData.summary) setSummary(initialData.summary);
    if (initialData.skills && initialData.skills.length > 0) {
      setSkills(initialData.skills);
    }
    if (initialData.workExperience && initialData.workExperience.length > 0) {
      setWorkExperience(initialData.workExperience);
    }
    if (initialData.projects && initialData.projects.length > 0) {
      setProjects(initialData.projects);
    }
    if (initialData.education && initialData.education.length > 0) {
      setEducation(initialData.education);
    }
  }

  // Validation States
  const [roleError, setRoleError] = useState<string | null>(null);
  const [expError, setExpError] = useState<string | null>(null);

  // Temporary inputs for new items
  const [showAddWork, setShowAddWork] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDates, setNewDates] = useState("");
  const [newWorkDesc, setNewWorkDesc] = useState("");

  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjTech, setNewProjTech] = useState("");

  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newInstitution, setNewInstitution] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newGradYear, setNewGradYear] = useState("");

  // Skills handlers
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (
      trimmed &&
      !skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput("");
      onClearError?.();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    onClearError?.();
  };

  // Work experience handlers
  const handleAddWorkExperience = () => {
    if (!newCompany.trim() && !newRole.trim()) return;
    setWorkExperience((prev) => [
      ...prev,
      {
        company: newCompany.trim() || "Company",
        role: newRole.trim() || "Role",
        title: newRole.trim() || "Role",
        startDate: newDates.trim() || "2022",
        endDate: "Present",
        description: newWorkDesc.trim() || "",
      },
    ]);
    setNewCompany("");
    setNewRole("");
    setNewDates("");
    setNewWorkDesc("");
    setShowAddWork(false);
  };

  const handleRemoveWorkExperience = (index: number) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // Projects handlers
  const handleAddProject = () => {
    if (!newProjName.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        name: newProjName.trim(),
        description: newProjDesc.trim() || "",
        technologies: newProjTech
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    ]);
    setNewProjName("");
    setNewProjDesc("");
    setNewProjTech("");
    setShowAddProject(false);
  };

  const handleRemoveProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!newInstitution.trim() && !newQualification.trim()) return;
    const yearParsed = newGradYear.trim()
      ? parseInt(newGradYear.trim(), 10)
      : null;
    setEducation((prev) => [
      ...prev,
      {
        institution: newInstitution.trim() || null,
        qualification: newQualification.trim() || null,
        graduationYear:
          yearParsed && !Number.isNaN(yearParsed) ? yearParsed : null,
      },
    ]);
    setNewInstitution("");
    setNewQualification("");
    setNewGradYear("");
    setShowAddEdu(false);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm and proceed to dashboard
  const handleConfirm = async () => {
    let hasError = false;

    if (!currentRole.trim()) {
      setRoleError(
        "Current role is required to establish your career baseline.",
      );
      hasError = true;
    } else {
      setRoleError(null);
    }

    const trimmedExp = yearsOfExperience.trim();
    if (!trimmedExp) {
      setExpError("Years of experience is required.");
      hasError = true;
    } else if (!EXP_ONE_DECIMAL_REGEX.test(trimmedExp)) {
      setExpError("Please enter a valid number (e.g. 3 or 3.5).");
      hasError = true;
    } else {
      const num = Number.parseFloat(trimmedExp);
      if (num < 0 || num > 50) {
        setExpError("Experience must be between 0 and 50 years.");
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
      summary: summary.trim(),
      targetRole: targetRole.trim() || undefined,
      workExperience,
      projects,
      education,
    };

    // Store in session storage so dashboard immediately picks up these exact values
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          "csa_career_profile",
          JSON.stringify(confirmedProfile),
        );
      } catch {
        // Ignore fallback
      }
    }

    await onConfirm(confirmedProfile, fullReviewedData);
  };

  const isRoleMissing = !initialData.currentRole;
  const isExpMissing =
    initialData.yearsOfExperience === null ||
    initialData.yearsOfExperience === undefined;
  const hasIncompleteDetection = isRoleMissing || isExpMissing;

  return (
    <VStack gap={5} width="100%">
      {!hideTopHeader && (
      /* Report Header & Meta Bar */
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--color-gunmetal, #1f2433)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--color-periwinkle-glow, #98a4f7)",
                background: "rgba(91, 99, 211, 0.15)",
                border: "1px solid rgba(152, 164, 247, 0.3)",
                padding: "3px 10px",
                borderRadius: 9999,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              PROFILE AUDIT REPORT // BASELINE CALIBRATION
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <StatusDot variant="success" label="Extracted" />
              <span style={{ fontSize: "0.75rem", color: "#86EFAC" }}>
                Analysis Ready
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-muted-steel, #646e87)",
            }}
          >
            Editable Report Mode • Auto-saves to session
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <VStack gap={1}>
            <Heading
              level={1}
              weight="semibold"
              style={{ fontSize: "1.65rem", margin: 0 }}
            >
              Review extracted career data
            </Heading>
            <Text
              type="supporting"
              color="secondary"
              style={{ fontSize: "0.88rem" }}
            >
              Calibrate and refine your technical baseline report below before
              proceeding to your dashboard.
            </Text>
          </VStack>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: "var(--color-carbon-surface, #151621)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: "0.8rem",
            }}
          >
            <div>
              <span style={{ color: "var(--color-muted-steel, #646e87)" }}>
                Origin:{" "}
              </span>
              <span style={{ fontWeight: 600, color: "#ffffff" }}>
                {currentRole || "Pending"} ({yearsOfExperience || "0"} yrs)
              </span>
            </div>
            <span style={{ color: "var(--color-muted-steel, #646e87)" }}>
              |
            </span>
            <div>
              <span style={{ color: "var(--color-muted-steel, #646e87)" }}>
                Skills:{" "}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--color-periwinkle-glow, #98a4f7)",
                }}
              >
                {skills.length} verified
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

            {hideBottomBar && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderRadius: 12, background: "var(--color-carbon-surface, #151621)", border: "1px solid var(--color-gunmetal, #1f2433)", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--color-periwinkle-glow, #98a4f7)", background: "rgba(91, 99, 211, 0.15)", border: "1px solid rgba(152, 164, 247, 0.3)", padding: "3px 10px", borderRadius: 9999, letterSpacing: "0.05em", textTransform: "uppercase" }}>PROFILE CALIBRATION</span>
            <span style={{ fontSize: "0.8rem", color: "#86EFAC" }}>✓ Live Calibration Mode</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Button label="← Back to upload" variant="secondary" onClick={onBack} isDisabled={isSaving} /><button type="button" id="proceed-to-dashboard-btn" onClick={() => void handleConfirm()} disabled={isSaving} aria-label="Confirm & Save Profile →" style={{ background: "linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)", color: "#ffffff", border: "none", borderRadius: 9999, padding: "9px 24px", fontSize: "0.88rem", fontWeight: 500, cursor: isSaving ? "not-allowed" : "pointer", boxShadow: "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
            <CheckCircle2 size={15} />
          </button></div></div>
      )}
      {/* Trajectory Strength Gauge */}
      <TrajectoryStrengthGauge
        currentRole={currentRole}
        yearsOfExperience={yearsOfExperience}
        skillsCount={skills.length}
        targetRole={targetRole}
      />

      {/* Error or Warning Banners */}
      {saveError && (
        <Card variant="red" elevation="none" style={{ padding: "14px 18px" }}>
          <HStack justify="between" align="center">
            <VStack gap={1}>
              <Text
                type="body"
                weight="semibold"
                style={{ color: "var(--color-text-red, #f87171)" }}
              >
                Failed to save career profile
              </Text>
              <Text
                type="body"
                style={{
                  color: "var(--color-text-red, #f87171)",
                  fontSize: "0.85rem",
                }}
              >
                {saveError}
              </Text>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-frost, #c9d3ee)",
                }}
              >
                Your edits have been preserved. You can edit and retry.
              </span>
            </VStack>
            {onClearError && (
              <Button
                label="Dismiss"
                variant="ghost"
                size="sm"
                onClick={onClearError}
              />
            )}
          </HStack>
        </Card>
      )}

      {/* Extraction Warnings or Notices */}
      {initialData.warnings && initialData.warnings.length > 0 && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={18} style={{ color: "#EF4444", flexShrink: 0 }} />
          <div>
            <span
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "#FCA5A5" }}
            >
              Extraction Notice
            </span>
            {initialData.warnings.map((w, idx) => (
              <div
                key={idx}
                style={{ fontSize: "0.78rem", color: "#FCA5A5", opacity: 0.9 }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasIncompleteDetection && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <div>
            <span
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "#FDE68A" }}
            >
              Some sections need your attention
            </span>
            <div
              style={{ fontSize: "0.78rem", color: "#FDE68A", opacity: 0.9 }}
            >
              Your role and years of experience were not clearly detected from
              the document. Please calibrate them below.
            </div>
          </div>
        </div>
      )}

      {/* EDITABLE REPORT DOCUMENT CONTAINER */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(340px, 1.25fr) minmax(320px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT REPORT COLUMN: Executive Baseline & Skills */}
        <VStack gap={4} width="100%">
          {/* Section 01: Current Role & Experience */}
          <div
            style={{
              background: "var(--color-carbon-surface, #151621)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              boxShadow:
                "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <User
                size={16}
                style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }}
              />
              <Heading
                level={3}
                weight="medium"
                style={{ fontSize: "1rem", margin: 0 }}
              >
                Current role &amp; experience
              </Heading>
            </div>

            <VStack gap={3}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <TextInput
                    label="Current role *"
                    value={currentRole}
                    onChange={(val) => {
                      setCurrentRole(val);
                      if (roleError) setRoleError(null);
                    }}
                    placeholder="e.g. Frontend Developer"
                    isRequired
                    status={
                      roleError
                        ? { type: "error", message: roleError }
                        : undefined
                    }
                  />
                </div>
                <div>
                  <TextInput
                    label="Years of experience *"
                    value={yearsOfExperience}
                    onChange={(val) => {
                      setYearsOfExperience(val);
                      if (expError) setExpError(null);
                    }}
                    placeholder="e.g. 4"
                    isRequired
                    status={
                      expError
                        ? { type: "error", message: expError }
                        : undefined
                    }
                  />
                </div>
              </div>

              <div>
                <TextInput
                  label="Target role (Optional)"
                  value={targetRole}
                  onChange={setTargetRole}
                  placeholder="e.g. Cloud Architect, Staff Engineer (or select on Explore Paths)"
                  isOptional
                />
              </div>

              <div>
                <TextArea
                  label="Summary (Optional)"
                  value={summary}
                  onChange={setSummary}
                  placeholder="Brief summary of your technical background, leadership, or career achievements..."
                  rows={3}
                  isOptional
                />
              </div>
            </VStack>
          </div>

          {/* Section 02: Technical Skills Matrix */}
          <div
            style={{
              background: "var(--color-carbon-surface, #151621)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              boxShadow:
                "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Layers
                  size={16}
                  style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }}
                />
                <Heading
                  level={3}
                  weight="medium"
                  style={{ fontSize: "1rem", margin: 0 }}
                >
                  Technical skills ({skills.length})
                </Heading>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-muted-steel, #646e87)",
                }}
              >
                Click × to remove incorrect skills
              </span>
            </div>

            <VStack gap={3}>
              {/* Active Skill Chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: 10,
                  background: "var(--color-void-black, #0f101a)",
                  border: "1px solid var(--color-gunmetal, #1f2433)",
                  borderRadius: 10,
                  minHeight: 52,
                }}
              >
                {skills.map((skill) => (
                  <Token
                    key={skill}
                    label={skill}
                    size="sm"
                    onRemove={() => handleRemoveSkill(skill)}
                  />
                ))}
                {skills.length === 0 && (
                  <Text type="supporting" color="secondary">
                    No skills added yet. Type below to add competencies.
                  </Text>
                )}
              </div>

              {/* Add a Skill Input */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <TextInput
                    label="Add a skill"
                    value={newSkillInput}
                    onChange={setNewSkillInput}
                    placeholder="e.g. Docker, TypeScript, Go"
                  />
                </div>
                <Button
                  label="Add skill"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSkill}
                  isDisabled={!newSkillInput.trim()}
                />
              </div>

              {/* Suggested Skills to Add */}
              {suggestedSkills.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-muted-steel, #646e87)",
                    }}
                  >
                    Suggested:
                  </span>
                  {suggestedSkills.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSkills((prev) => [...prev, s]);
                      }}
                      style={{
                        background: "transparent",
                        border: "1px dashed var(--color-gunmetal, #1f2433)",
                        borderRadius: 9999,
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        color: "var(--color-frost, #c9d3ee)",
                        cursor: "pointer",
                      }}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
            </VStack>
          </div>
        </VStack>

        {/* RIGHT REPORT COLUMN: Experience, Projects & Education */}
        <VStack gap={4} width="100%">
          {/* Section 03: Work Experience Record */}
          <div
            style={{
              background: "var(--color-carbon-surface, #151621)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              boxShadow:
                "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Briefcase
                  size={16}
                  style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }}
                />
                <Heading
                  level={3}
                  weight="medium"
                  style={{ fontSize: "1rem", margin: 0 }}
                >
                  Work experience ({workExperience.length})
                </Heading>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWork(!showAddWork)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-periwinkle-glow, #98a4f7)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={14} />
                <span>+ Add experience</span>
              </button>
            </div>

            {/* List of Work Experiences */}
            <VStack gap={2}>
              {workExperience.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "var(--color-void-black, #0f101a)",
                    border: "1px solid var(--color-gunmetal, #1f2433)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "#ffffff",
                        }}
                      >
                        {item.role || item.title}
                        {item.company ? ` at ${item.company}` : ""}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-frost, #c9d3ee)",
                        }}
                      >
                        {item.startDate || "2022"} - {item.endDate || "Present"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkExperience(idx)}
                      aria-label="Remove"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-muted-steel, #646e87)",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--color-muted-steel, #646e87)",
                        marginTop: 2,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              ))}

              {workExperience.length === 0 && !showAddWork && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--color-muted-steel, #646e87)",
                    padding: "6px 0",
                  }}
                >
                  No previous work experience extracted. You can add positions
                  or skip this section.
                </div>
              )}

              {/* Add Work Form Drawer */}
              {showAddWork && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: "var(--color-void-black, #0f101a)",
                    border: "1px solid var(--color-periwinkle-glow, #98a4f7)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <TextInput
                    label="Company Name"
                    value={newCompany}
                    onChange={setNewCompany}
                    placeholder="e.g. Acme Tech"
                  />
                  <TextInput
                    label="Position / Role"
                    value={newRole}
                    onChange={setNewRole}
                    placeholder="e.g. Senior Software Engineer"
                  />
                  <TextInput
                    label="Dates / Timeline"
                    value={newDates}
                    onChange={setNewDates}
                    placeholder="e.g. 2021 - Present"
                  />
                  <TextArea
                    label="Key Accomplishments (Optional)"
                    value={newWorkDesc}
                    onChange={setNewWorkDesc}
                    placeholder="Led frontend architecture, built component libraries..."
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
                    />
                  </HStack>
                </div>
              )}
            </VStack>
          </div>

          {/* Section 04: Projects Record */}
          <div
            style={{
              background: "var(--color-carbon-surface, #151621)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              boxShadow:
                "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FolderGit2
                  size={16}
                  style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }}
                />
                <Heading
                  level={3}
                  weight="medium"
                  style={{ fontSize: "1rem", margin: 0 }}
                >
                  Projects ({projects.length})
                </Heading>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProject(!showAddProject)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-periwinkle-glow, #98a4f7)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={14} />
                <span>Add project</span>
              </button>
            </div>

            <VStack gap={2}>
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "var(--color-void-black, #0f101a)",
                    border: "1px solid var(--color-gunmetal, #1f2433)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#ffffff",
                      }}
                    >
                      {proj.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      aria-label="Remove"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-muted-steel, #646e87)",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {proj.description && (
                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--color-muted-steel, #646e87)",
                      }}
                    >
                      {proj.description}
                    </div>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        marginTop: 4,
                      }}
                    >
                      {proj.technologies.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: "0.68rem",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--color-frost, #c9d3ee)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {projects.length === 0 && !showAddProject && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--color-muted-steel, #646e87)",
                    padding: "6px 0",
                  }}
                >
                  No technical projects detected. You can add personal or open
                  source projects here or skip.
                </div>
              )}

              {/* Add Project Form */}
              {showAddProject && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: "var(--color-void-black, #0f101a)",
                    border: "1px solid var(--color-periwinkle-glow, #98a4f7)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <TextInput
                    label="Project Name"
                    value={newProjName}
                    onChange={setNewProjName}
                    placeholder="e.g. OpenMetrics Exporter"
                  />
                  <TextInput
                    label="Technologies Used"
                    value={newProjTech}
                    onChange={setNewProjTech}
                    placeholder="e.g. Go, Prometheus, Docker"
                  />
                  <TextArea
                    label="Project Overview"
                    value={newProjDesc}
                    onChange={setNewProjDesc}
                    placeholder="Prometheus exporter in Go with high throughput..."
                    rows={2}
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
                    />
                  </HStack>
                </div>
              )}
            </VStack>
          </div>

          {/* Section 05: Education & Credentials */}
          <div
            style={{
              background: "var(--color-carbon-surface, #151621)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              boxShadow:
                "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Award
                  size={16}
                  style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }}
                />
                <Heading
                  level={3}
                  weight="medium"
                  style={{ fontSize: "1rem", margin: 0 }}
                >
                  Education &amp; certifications ({education.length})
                </Heading>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEdu(!showAddEdu)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-periwinkle-glow, #98a4f7)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={14} />
                <span>Add education</span>
              </button>
            </div>

            <VStack gap={2}>
              {education.map((edu, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "var(--color-void-black, #0f101a)",
                    border: "1px solid var(--color-gunmetal, #1f2433)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#ffffff",
                      }}
                    >
                      {edu.qualification || "Degree"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-frost, #c9d3ee)",
                      }}
                    >
                      {edu.institution || "University"}
                      {edu.graduationYear ? ` • ${edu.graduationYear}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    aria-label="Remove"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-muted-steel, #646e87)",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {education.length === 0 && !showAddEdu && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--color-muted-steel, #646e87)",
                    padding: "6px 0",
                  }}
                >
                  No education history detected. You can add degrees or
                  certifications here or skip.
                </div>
              )}

              {/* Add Education Form */}
              {showAddEdu && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: "var(--color-void-black, #0f101a)",
                    border: "1px solid var(--color-periwinkle-glow, #98a4f7)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <TextInput
                    label="Institution / University"
                    value={newInstitution}
                    onChange={setNewInstitution}
                    placeholder="e.g. Georgia Tech"
                  />
                  <TextInput
                    label="Degree / Certification"
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
                    />
                  </HStack>
                </div>
              )}
            </VStack>
          </div>
        </VStack>
      </div>

      {!hideBottomBar && (
      /* Confirmation & Proceed Action Bar - Fixed to bottom of screen on internal & external pages */
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 40,
          background: "rgba(15, 16, 26, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid var(--color-gunmetal, #1f2433)",
          boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.65)",
          padding: "16px 24px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 24,
          borderRadius: "12px 12px 0 0",
        }}
      >
        <Button
          label="← Back to upload"
          variant="secondary"
          onClick={onBack}
          isDisabled={isSaving}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onSwitchToManual && (
            <Button
              label="Switch to manual form"
              variant="ghost"
              onClick={onSwitchToManual}
              isDisabled={isSaving}
            />
          )}

          {/* Primary CTA button matching wireframe & tests */}
          <button
            type="button"
            id="proceed-to-dashboard-btn"
            onClick={() => void handleConfirm()}
            disabled={isSaving}
            aria-label="Confirm & Save Profile →"
            style={{
              background:
                "linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 9999,
              padding: "12px 28px",
              fontSize: "0.96rem",
              fontWeight: 500,
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow:
                "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "opacity 0.2s ease",
            }}
          >
            <span>
              {isSaving
                ? "Saving profile..."
                : "Confirm & Proceed to Dashboard →"}
            </span>
            <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
      )}
    </VStack>
  );
}
