import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 * 
 * Configuration:
 * - Email/password authentication
 * - Email verification required
 * - Cognito default password policy (min 8 chars, requires uppercase, lowercase, number, special char)
 * - Access token expires in 1 hour (Cognito default)
 * - Refresh token expires in 30 days (Cognito default)
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false,  // Email cannot be changed after signup
    },
  },
  accountRecovery: 'EMAIL_ONLY',
});
