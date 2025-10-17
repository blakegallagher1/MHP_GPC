import { PrismaClient } from '@prisma/client';
import { getConfig } from '@mhp-gpc/config';
import { logger } from './logger';

let prisma: PrismaClient | undefined;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    const cfg = getConfig();
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: cfg.DATABASE_URL
        }
      },
      log: cfg.isProduction ? ['warn', 'error'] : ['query', 'info', 'warn', 'error']
    });

    prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;
      logger.debug({ model: params.model, action: params.action, duration }, 'Prisma query');
      return result;
    });
  }
  return prisma;
};
