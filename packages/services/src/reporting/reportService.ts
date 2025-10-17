import { getPrismaClient } from '@mhp-gpc/core';

export const buildExecutiveDashboard = async () => {
  const prisma = getPrismaClient();
  const [leadCount, dealsByStage, avgCapRate] = await Promise.all([
    prisma.lead.count(),
    prisma.deal.groupBy({
      by: ['stage'],
      _count: { _all: true }
    }),
    prisma.deal.aggregate({
      _avg: { targetCapRate: true }
    })
  ]);

  return {
    leadCount,
    dealsByStage,
    averageCapRate: avgCapRate._avg.targetCapRate
  };
};

export const buildAcquisitionSheet = async (dealId: string) => {
  const prisma = getPrismaClient();
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      lead: { include: { park: true } },
      riskAssessments: true,
      scenarioRuns: true
    }
  });
  return deal;
};

export const buildDDBinder = async (dealId: string) => {
  const prisma = getPrismaClient();
  const [tasks, documents, decisionLogs] = await Promise.all([
    prisma.task.findMany({ where: { dealId } }),
    prisma.document.findMany({ where: { dealId } }),
    prisma.decisionLog.findMany({ where: { dealId }, orderBy: { recordedAt: 'desc' } })
  ]);

  return {
    tasks,
    documents,
    decisionLogs
  };
};
