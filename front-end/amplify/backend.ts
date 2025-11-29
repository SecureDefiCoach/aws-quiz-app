import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { mongoConnector } from './functions/mongo-connector';

defineBackend({
  auth,
  mongoConnector, 
  data,
});