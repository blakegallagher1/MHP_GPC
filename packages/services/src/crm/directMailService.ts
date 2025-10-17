import { getPrismaClient, logger } from '@mhp-gpc/core';

export interface DirectMailRequest {
  ownerId: string;
  templateId: string;
  channel: 'mail' | 'email';
  metadata?: Record<string, unknown>;
}

export const sendDirectMail = async (request: DirectMailRequest) => {
  const prisma = getPrismaClient();
  const consent = await prisma.consentLog.findFirst({
    where: { ownerId: request.ownerId, channel: request.channel, granted: true }
  });
  if (!consent) {
    throw new Error(`No consent recorded for owner ${request.ownerId} via ${request.channel}`);
  }

  const dealId = request.metadata?.dealId as string | undefined;
  if (dealId) {
    await prisma.decisionLog.create({
      data: {
        dealId,
        decision: 'direct_mail_sent',
        rationale: `Template ${request.templateId} dispatched`,
        author: 'system'
      }
    });
  }

  logger.info({ request }, 'direct mail dispatched');
  return { status: 'queued', request };
};

export const logHeirSourcing = async (
  ownerId: string,
  payload: Record<string, unknown>,
  consentGranted: boolean
) => {
  const prisma = getPrismaClient();
  await prisma.consentLog.create({
    data: {
      ownerId,
      channel: 'heir_sourcing',
      granted: consentGranted,
      metadata: payload
    }
  });
  logger.info({ ownerId, consentGranted }, 'heir sourcing consent recorded');
};
