import { DealStage, Lead, LeadStatus, Prisma, TouchpointType } from '@prisma/client';
import { getPrismaClient, eventBus } from '@mhp-gpc/core';

export interface CreateLeadInput {
  parkId: string;
  source: string;
  status?: LeadStatus;
  assignedTo?: string;
}

export const createLead = async (input: CreateLeadInput): Promise<Lead> => {
  const prisma = getPrismaClient();
  const lead = await prisma.lead.create({
    data: {
      parkId: input.parkId,
      source: input.source,
      status: input.status ?? LeadStatus.NEW,
      assignedTo: input.assignedTo
    }
  });
  eventBus.emitEvent({ type: 'lead.created', payload: { leadId: lead.id } });
  return lead;
};

export const updateLeadStage = async (leadId: string, stage: DealStage): Promise<Lead> => {
  const prisma = getPrismaClient();
  const lead = await prisma.lead.update({ where: { id: leadId }, data: { stage } });
  eventBus.emitEvent({ type: 'lead.updated', payload: { leadId, stage } });
  return lead;
};

export const logTouchpoint = async (
  leadId: string,
  type: TouchpointType,
  subject: string,
  notes?: string,
  author?: string
) => {
  const prisma = getPrismaClient();
  return prisma.touchpoint.create({
    data: {
      leadId,
      type,
      subject,
      notes,
      author
    }
  });
};

export const listLeads = async (args: {
  status?: LeadStatus;
  stage?: DealStage;
  search?: string;
  skip?: number;
  take?: number;
}): Promise<Lead[]> => {
  const prisma = getPrismaClient();
  const where: Prisma.LeadWhereInput = {};
  if (args.status) {
    where.status = args.status;
  }
  if (args.stage) {
    where.stage = args.stage;
  }
  if (args.search) {
    where.OR = [
      { source: { contains: args.search, mode: 'insensitive' } },
      { park: { name: { contains: args.search, mode: 'insensitive' } } }
    ];
  }
  return prisma.lead.findMany({
    where,
    skip: args.skip,
    take: args.take,
    include: {
      park: true,
      touchpoints: { orderBy: { performedAt: 'desc' }, take: 5 }
    },
    orderBy: { createdAt: 'desc' }
  });
};
