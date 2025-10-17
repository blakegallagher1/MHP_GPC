import { Deal, DealStage, Prisma, BuyBoxStatus } from '@prisma/client';
import { getPrismaClient, eventBus } from '@mhp-gpc/core';

export interface CreateDealInput {
  leadId: string;
  stage?: DealStage;
  offerPrice?: number;
  targetCapRate?: number;
}

export const createDeal = async (input: CreateDealInput): Promise<Deal> => {
  const prisma = getPrismaClient();
  const deal = await prisma.deal.create({
    data: {
      leadId: input.leadId,
      stage: input.stage ?? DealStage.INTAKE,
      offerPrice: input.offerPrice ? new Prisma.Decimal(input.offerPrice) : undefined,
      targetCapRate: input.targetCapRate ? new Prisma.Decimal(input.targetCapRate) : undefined
    }
  });
  eventBus.emitEvent({ type: 'deal.updated', payload: { dealId: deal.id, stage: deal.stage } });
  return deal;
};

export const updateDealStage = async (dealId: string, stage: DealStage): Promise<Deal> => {
  const prisma = getPrismaClient();
  const deal = await prisma.deal.update({ where: { id: dealId }, data: { stage } });
  eventBus.emitEvent({ type: 'deal.updated', payload: { dealId, stage } });
  return deal;
};

export const updateBuyBoxStatus = async (
  dealId: string,
  status: BuyBoxStatus,
  notes?: string,
  scoreDelta?: number
): Promise<Deal> => {
  const prisma = getPrismaClient();
  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      buyBoxStatus: status,
      underwritingNotes: notes,
      dealScore: scoreDelta ? { increment: scoreDelta } : undefined
    }
  });
  eventBus.emitEvent({ type: 'deal.updated', payload: { dealId, stage: deal.stage } });
  return deal;
};

export const listDeals = async (args: { stage?: DealStage; skip?: number; take?: number }): Promise<Deal[]> => {
  const prisma = getPrismaClient();
  return prisma.deal.findMany({
    where: args.stage ? { stage: args.stage } : undefined,
    include: {
      lead: { include: { park: true } },
      tasks: true,
      riskAssessments: true
    },
    skip: args.skip,
    take: args.take,
    orderBy: { updatedAt: 'desc' }
  });
};
