import { describe, it, expect } from 'vitest';

// Mirrors the math used in ScenarioComparison.tsx so we can validate it
// without rendering a JSX tree. Keeps the contract documented + unit-tested.
function computeScenario(traj: any, petAgeYears: number) {
  const yearsWith = traj?.projection?.years_with_protocol || traj?.years_with_protocol || [];
  const yearsWithout = traj?.projection?.years_without_protocol || traj?.years_without_protocol || [];
  if (yearsWith.length === 0 || yearsWithout.length === 0) return null;
  const lastWith = yearsWith[yearsWith.length - 1];
  const lastWithout = yearsWithout[yearsWithout.length - 1];
  const yearsGained =
    traj?.projection?.years_gained_total ??
    traj?.years_gained ??
    (lastWith.expected_remaining_years - lastWithout.expected_remaining_years);
  return {
    yearsGained,
    expectancyWith: petAgeYears + lastWith.expected_remaining_years,
    expectancyWithout: petAgeYears + lastWithout.expected_remaining_years,
  };
}

const baseYear = (year: number, age: number, bio: number, remain: number) => ({
  year, age_at_year: age, biological_age: bio, expected_remaining_years: remain,
  existing_conditions: [], new_conditions: [],
});

describe('ScenarioComparison logic', () => {
  it('returns null when projection arrays are empty', () => {
    expect(computeScenario({ projection: { years_with_protocol: [], years_without_protocol: [] } }, 5)).toBeNull();
    expect(computeScenario(null, 5)).toBeNull();
  });

  it('uses years_gained_total when provided', () => {
    const traj = {
      projection: {
        years_gained_total: 0.8,
        years_with_protocol: [baseYear(1, 6, 5.5, 8)],
        years_without_protocol: [baseYear(1, 6, 6.0, 7.2)],
      },
    };
    const r = computeScenario(traj, 5)!;
    expect(r.yearsGained).toBe(0.8);
    expect(r.expectancyWith).toBeCloseTo(13);
    expect(r.expectancyWithout).toBeCloseTo(12.2);
  });

  it('falls back to delta of expected_remaining_years', () => {
    const traj = {
      projection: {
        years_with_protocol: [baseYear(2, 7, 6.5, 7.5)],
        years_without_protocol: [baseYear(2, 7, 7.2, 6.5)],
      },
    };
    const r = computeScenario(traj, 5)!;
    expect(r.yearsGained).toBeCloseTo(1.0);
  });

  it('handles negative net effect (polypharmacy caveat)', () => {
    const traj = {
      projection: {
        years_gained_total: -0.3,
        years_with_protocol: [baseYear(1, 6, 6.2, 6.8)],
        years_without_protocol: [baseYear(1, 6, 6.0, 7.1)],
      },
    };
    expect(computeScenario(traj, 5)!.yearsGained).toBe(-0.3);
  });
});
