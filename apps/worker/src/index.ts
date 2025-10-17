import { Queue, Worker, QueueScheduler, JobsOptions } from 'bullmq';
import cron from 'node-cron';
import { getConfig } from '@mhp-gpc/config';
import { eventBus, logger } from '@mhp-gpc/core';
import { FinancialScreeningService, ReportService } from '@mhp-gpc/services';

const cfg = getConfig();

const connection = cfg.REDIS_URL
  ? {
      connection: {
        url: cfg.REDIS_URL
      }
    }
  : undefined;

const rescoringQueue = connection
  ? new Queue('deal-rescoring', {
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      ...connection
    })
  : undefined;

if (connection) {
  // eslint-disable-next-line no-new
  new QueueScheduler('deal-rescoring', connection);
}

const worker = connection
  ? new Worker(
      'deal-rescoring',
      async (job) => {
        const { dealId } = job.data as { dealId: string };
        logger.info({ dealId }, 'running scheduled re-score');
        const sheet = await ReportService.buildAcquisitionSheet(dealId);
        if (!sheet) {
          logger.warn({ dealId }, 'deal not found during re-score');
          return;
        }
        const scenarios = [
          { rentGrowth: 0.02, expenseGrowth: 0.01, occupancy: 0.92, insuranceIncrease: 0.05, rateShockBps: 150 },
          { rentGrowth: -0.01, expenseGrowth: 0.03, occupancy: 0.85, insuranceIncrease: 0.1, rateShockBps: 250 }
        ];
        const base = {
          dealId,
          pads: sheet.lead?.park?.padCount ?? 100,
          currentRent: Number(sheet.lead?.park?.avgRent ?? 450),
          expenseRatio: 0.35,
          otherIncome: 0,
          debtService: Number(sheet.dscr ?? 1.2) * 100000,
          purchasePrice: Number(sheet.offerPrice ?? 5000000),
          capRateThreshold: 0.07,
          dscrThreshold: 1.25,
          occupancyFloor: 0.85,
          insuranceBase: 50000
        };
        await FinancialScreeningService.persistScenarioResults(base, scenarios, 'scheduled');
      },
      connection
    )
  : undefined;

worker?.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'deal re-score job failed');
});

export const scheduleReScore = async (dealId: string, options?: JobsOptions) => {
  if (!rescoringQueue) {
    logger.warn({ dealId }, 'Redis not configured; skipping re-score enqueue');
    return;
  }
  await rescoringQueue.add('deal-rescore', { dealId }, options);
};

eventBus.onEvent('deal.rescored', async ({ dealId }) => {
  logger.info({ dealId }, 'deal rescored event received');
});

cron.schedule('0 * * * *', async () => {
  logger.info('enqueueing hourly re-score sweep');
  // In a full implementation this would query deals needing updates. Here we emit placeholder job.
  await scheduleReScore('placeholder-deal-id', { jobId: 'hourly-rescore' });
});

logger.info('Worker bootstrapped');
