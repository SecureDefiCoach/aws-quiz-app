import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { mongoConnector } from './functions/mongo-connector';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  mongoConnector, 
  data,
});

// Add Cognito admin permissions to Lambda
backend.mongoConnector.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-idp:ListUsers',
      'cognito-idp:AdminConfirmSignUp',
      'cognito-idp:AdminDeleteUser',
      'cognito-idp:AdminGetUser',
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Add USER_POOL_ID environment variable
backend.mongoConnector.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);