import { describe, it, expect } from 'vitest';
import { FinancialScreeningService } from '@mhp-gpc/services';

describe('FinancialScreeningService', () => {
  it('evaluates scenarios and returns buy-box result', () => {
    const base = {
      dealId: 'deal-1',
      pads: 100,
      currentRent: 500,
      expenseRatio: 0.35,
      otherIncome: 10000,
      debtService: 120000,
      purchasePrice: 5000000,
      capRateThreshold: 0.065,
      dscrThreshold: 1.25,
      occupancyFloor: 0.85,
      insuranceBase: 60000
    };
    const scenarios = [
      {
        rentGrowth: 0.03,
        expenseGrowth: 0.01,
        occupancy: 0.95,
        insuranceIncrease: 0.05,
        rateShockBps: 100
      },
      {
        rentGrowth: -0.02,
        expenseGrowth: 0.04,
        occupancy: 0.8,
        insuranceIncrease: 0.1,
        rateShockBps: 250
      }
    ];

    const results = FinancialScreeningService.evaluateFinancialScenarios(base, scenarios);
    expect(results).toHaveLength(2);
    const [positive, negative] = results;
    expect(positive.meetsBuyBox).toBeTypeOf('boolean');
    expect(negative.meetsBuyBox).toBe(false);
    expect(negative.commentary.length).toBeGreaterThan(0);
  });
});
