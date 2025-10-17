import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import router from './routes/index';
import { getConfig } from '@mhp-gpc/config';
import { logger } from '@mhp-gpc/core';
import { errorHandler } from './middleware/errorHandler';

export const buildApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(
    pinoHttp({
      logger
    })
  );
  app.use('/api', router);
  app.use(errorHandler);
  return app;
};

if (require.main === module) {
  const config = getConfig();
  const app = buildApp();
  app.listen(config.PORT, () => {
    logger.info(`API server running on port ${config.PORT}`);
  });
}
