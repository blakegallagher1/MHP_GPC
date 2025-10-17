import { Prisma } from '@prisma/client';
import { getPrismaClient, eventBus } from '@mhp-gpc/core';
import { ScenarioInput, ScenarioResult } from '../types';

export interface FinancialInputs {
  dealId: string;
  pads: number;
  currentRent: number;
  expenseRatio: number;
  otherIncome: number;
  debtService: number;
  purchasePrice: number;
  capRateThreshold: number;
  dscrThreshold: number;
  occupancyFloor: number;
  insuranceBase: number;
}

const calculateScenario = (base: FinancialInputs, scenario: ScenarioInput): ScenarioResult => {
  const effectiveRent = base.currentRent * (1 + scenario.rentGrowth);
  const effectiveOccupancy = Math.min(1, Math.max(base.occupancyFloor, scenario.occupancy));
  const grossPotentialIncome = effectiveRent * base.pads * 12;
  const effectiveGrossIncome = grossPotentialIncome * effectiveOccupancy + base.otherIncome;
  const expenseLoad = effectiveGrossIncome * (base.expenseRatio * (1 + scenario.expenseGrowth));
  const insuranceCost = base.insuranceBase * (1 + scenario.insuranceIncrease);
  const noi = effectiveGrossIncome - expenseLoad - insuranceCost;
  const debtShockMultiplier = 1 + scenario.rateShockBps / 10000;
  const dscr = noi / (base.debtService * debtShockMultiplier);
  const capRate = noi / base.purchasePrice;

  const meetsBuyBox =
    capRate >= base.capRateThreshold &&
    dscr >= base.dscrThreshold &&
    effectiveOccupancy >= base.occupancyFloor;

  const commentary: string[] = [];
  if (!meetsBuyBox) {
    if (capRate < base.capRateThreshold) {
      commentary.push(
        `Cap rate ${capRate.toFixed(3)} falls below threshold ${base.capRateThreshold.toFixed(3)}.`
      );
    }
    if (dscr < base.dscrThreshold) {
      commentary.push(`DSCR ${dscr.toFixed(2)} under target ${base.dscrThreshold.toFixed(2)}.`);
    }
    if (effectiveOccupancy < base.occupancyFloor) {
      commentary.push(
        `Occupancy ${(effectiveOccupancy * 100).toFixed(1)}% under floor ${(base.occupancyFloor * 100).toFixed(0)}%.`
      );
    }
  } else {
    commentary.push('Scenario passes buy-box requirements.');
  }

  return {
    scenario,
    noi,
    dscr,
    capRate,
    meetsBuyBox,
    commentary
  };
};

export const evaluateFinancialScenarios = (
  base: FinancialInputs,
  scenarios: ScenarioInput[]
): ScenarioResult[] => {
  return scenarios.map((scenario) => calculateScenario(base, scenario));
};

export const persistScenarioResults = async (
  base: FinancialInputs,
  scenarios: ScenarioInput[],
  label: string
) => {
  const prisma = getPrismaClient();
  const results = evaluateFinancialScenarios(base, scenarios);
  const transaction = await prisma.$transaction(async (tx) => {
    return Promise.all(
      results.map((result, index) =>
        tx.scenarioEvaluation.create({
          data: {
            dealId: base.dealId,
            name: `${label}-${index + 1}`,
            inputs: result.scenario as unknown as Prisma.InputJsonValue,
            results: {
              noi: result.noi,
              dscr: result.dscr,
              capRate: result.capRate,
              meetsBuyBox: result.meetsBuyBox,
              commentary: result.commentary
            } as Prisma.InputJsonValue
          }
        })
      )
    );
  });

  const anyPass = results.some((result) => result.meetsBuyBox);
  if (anyPass) {
    eventBus.emitEvent({ type: 'deal.rescored', payload: { dealId: base.dealId } });
  }

  return { results, saved: transaction.length };
};
