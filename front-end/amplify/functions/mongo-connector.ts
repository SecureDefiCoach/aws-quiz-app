// File: amplify/functions/mongo-connector.ts

import { defineFunction, secret } from '@aws-amplify/backend';

export const mongoConnector = defineFunction({
  name: 'mongo-connector',
  entry: './mongo-connector/handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  environment: {
    MONGO_URI: secret('MONGO_URI'),
    DB_NAME: 'aws-quiz-db',
    LOG_LEVEL: 'INFO',
    NODE_ENV: 'production',
  },
});