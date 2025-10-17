import { getPrismaClient, logger } from '@mhp-gpc/core';

export interface AutomationTask {
  dealId: string;
  type: 'send_mailer' | 'schedule_site_visit' | 'follow_up_call';
  payload?: Record<string, unknown>;
}

export const enqueueAutomationTask = async (task: AutomationTask) => {
  const prisma = getPrismaClient();
  await prisma.task.create({
    data: {
      dealId: task.dealId,
      title: `Automation:${task.type}`,
      description: JSON.stringify(task.payload ?? {}),
      checklist: 'automation'
    }
  });
  logger.info({ task }, 'automation task queued');
};
