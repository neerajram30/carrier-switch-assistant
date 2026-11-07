import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrajectoryStrengthGauge } from './TrajectoryStrengthGauge';

describe('TrajectoryStrengthGauge Component', () => {
  it('renders initial baseline state with incomplete fields', () => {
    render(
      <TrajectoryStrengthGauge
        currentRole=""
        yearsOfExperience=""
        skillsCount={0}
        targetRole=""
      />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Baseline Initializing')).toBeInTheDocument();
    expect(screen.getByText(/Arsenal \(0\/5\+ skills\)/i)).toBeInTheDocument();
  });

  it('calculates score dynamically when role and experience are provided', () => {
    render(
      <TrajectoryStrengthGauge
        currentRole="Senior Backend Engineer"
        yearsOfExperience="5"
        skillsCount={3}
        targetRole=""
      />,
    );

    // 30 (role) + 20 (exp) + 15 (skills >= 3) = 65%
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Telemetry Calibrated')).toBeInTheDocument();
  });

  it('reaches 100% when all fields and target role are calibrated', () => {
    render(
      <TrajectoryStrengthGauge
        currentRole="Staff Frontend Engineer"
        yearsOfExperience="8"
        skillsCount={6}
        targetRole="AI Platform Architect"
      />,
    );

    // 30 (role) + 20 (exp) + 25 (skills >= 5) + 25 (targetRole) = 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/Trajectory 100% Locked/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your baseline and target role are fully calibrated/i),
    ).toBeInTheDocument();
  });
});
