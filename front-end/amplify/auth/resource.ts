import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 * 
 * Configuration:
 * - Email/password authentication
 * - Admin approval required (no email verification needed)
 * - Users can sign up but cannot log in until admin confirms them
 * - Cognito default password policy (min 8 chars, requires uppercase, lowercase, number, special char)
 * - Access token expires in 1 hour (Cognito default)
 * - Refresh token expires in 30 days (Cognito default)
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Verify your ERT Quiz App account',
      verificationEmailBody: (createCode) => 
        `Welcome to the Exam Readiness Tracker (ERT) Quiz App!\n\nYour verification code is: ${createCode()}\n\nEnter this code to complete your registration and start tracking your certification exam progress.\n\nIf you didn't sign up for this app, you can safely ignore this email.`,
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
});
