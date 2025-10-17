import pino from 'pino';
import { getConfig } from '@mhp-gpc/config';

const cfg = getConfig();

export const logger = pino({
  level: cfg.LOG_LEVEL,
  transport: cfg.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
});
