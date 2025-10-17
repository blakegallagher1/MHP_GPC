export type PipelineStage =
  | 'intake'
  | 'qualification'
  | 'screening'
  | 'diligence'
  | 'investment_committee'
  | 'post_close';

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ScenarioInput {
  rentGrowth: number;
  expenseGrowth: number;
  occupancy: number;
  insuranceIncrease: number;
  rateShockBps: number;
}

export interface ScenarioResult {
  scenario: ScenarioInput;
  noi: number;
  dscr: number;
  capRate: number;
  meetsBuyBox: boolean;
  commentary: string[];
}
