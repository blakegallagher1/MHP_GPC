import { RiskAssessment, Task, TaskStatus } from '@prisma/client';
import { getPrismaClient } from '@mhp-gpc/core';

export interface ChecklistItem {
  title: string;
  description?: string;
  dueDate?: Date;
  assignee?: string;
}

export const upsertChecklist = async (dealId: string, checklist: ChecklistItem[]): Promise<Task[]> => {
  const prisma = getPrismaClient();
  const tasks: Task[] = [];
  for (const item of checklist) {
    const task = await prisma.task.upsert({
      where: {
        dealId_title: {
          dealId,
          title: item.title
        }
      },
      update: {
        description: item.description,
        dueDate: item.dueDate,
        assignedTo: item.assignee
      },
      create: {
        dealId,
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        assignedTo: item.assignee,
        checklist: 'dd'
      }
    });
    tasks.push(task);
  }
  return tasks;
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task> => {
  const prisma = getPrismaClient();
  return prisma.task.update({ where: { id: taskId }, data: { status } });
};

export const scoreRisk = async (
  dealId: string,
  score: number,
  riskLevel: RiskAssessment['riskLevel'],
  notes?: string,
  assessedBy?: string
): Promise<RiskAssessment> => {
  const prisma = getPrismaClient();
  return prisma.riskAssessment.create({
    data: {
      dealId,
      score,
      riskLevel,
      notes,
      assessedBy
    }
  });
};

export const getDiligenceSnapshot = async (dealId: string) => {
  const prisma = getPrismaClient();
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      tasks: true,
      riskAssessments: true,
      documents: true
    }
  });
};
