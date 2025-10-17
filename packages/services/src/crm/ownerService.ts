import { Prisma, Owner } from '@prisma/client';
import { getPrismaClient } from '@mhp-gpc/core';

export interface OwnerInput {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
}

export const createOwner = async (input: OwnerInput): Promise<Owner> => {
  const prisma = getPrismaClient();
  return prisma.owner.create({ data: input });
};

export const listOwners = async (args: { search?: string; take?: number; skip?: number }): Promise<Owner[]> => {
  const prisma = getPrismaClient();
  const where: Prisma.OwnerWhereInput | undefined = args.search
    ? {
        OR: [
          { name: { contains: args.search, mode: 'insensitive' } },
          { contactEmail: { contains: args.search, mode: 'insensitive' } },
          { contactPhone: { contains: args.search, mode: 'insensitive' } }
        ]
      }
    : undefined;
  return prisma.owner.findMany({
    where,
    skip: args.skip,
    take: args.take,
    orderBy: { createdAt: 'desc' }
  });
};

export const recordConsent = async (ownerId: string, channel: string, granted: boolean, metadata?: Record<string, unknown>) => {
  const prisma = getPrismaClient();
  return prisma.consentLog.create({
    data: {
      ownerId,
      channel,
      granted,
      metadata
    }
  });
};
