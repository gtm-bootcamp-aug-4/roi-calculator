import type { RoiInputs } from './types';

export interface RoiResult {
  /** Annual fully loaded cost of the engineering time in scope. */
  toilCost: number;
  /** Annual cost of the toil Devin is expected to absorb. */
  recoveredCost: number;
  /** Recovered cost net of Devin's annual platform cost. */
  netAnnualSavings: number;
  /** Net savings divided by Devin cost, e.g. 3.2 means 3.2x. */
  roiMultiple: number;
  /** Engineer-years of capacity returned to the team. */
  engineerYearsRecovered: number;
  /** Months for net savings to cover the annual Devin cost; null when never. */
  paybackMonths: number | null;
}

/**
 * Pure ROI model shared by the build-time preview and the client-side
 * calculator embedded in every generated page.
 *
 * The function body is serialized into the generated HTML, so it must stay
 * dependency-free and self-contained.
 */
export function computeRoi(inputs: RoiInputs): RoiResult {
  const engineers = Math.max(0, inputs.engineers);
  const avgSalary = Math.max(0, inputs.avgSalary);
  const toilShare = Math.min(100, Math.max(0, inputs.toilPercent)) / 100;
  const automationShare = Math.min(100, Math.max(0, inputs.automationPercent)) / 100;
  const devinAnnualCost = Math.max(0, inputs.devinAnnualCost);

  const toilCost = engineers * avgSalary * toilShare;
  const recoveredCost = toilCost * automationShare;
  const netAnnualSavings = recoveredCost - devinAnnualCost;
  const roiMultiple = devinAnnualCost > 0 ? netAnnualSavings / devinAnnualCost : 0;
  const engineerYearsRecovered = engineers * toilShare * automationShare;
  const paybackMonths = recoveredCost > 0 ? (devinAnnualCost / recoveredCost) * 12 : null;

  return {
    toilCost,
    recoveredCost,
    netAnnualSavings,
    roiMultiple,
    engineerYearsRecovered,
    paybackMonths,
  };
}
