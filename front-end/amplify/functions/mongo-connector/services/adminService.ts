/**
 * @file adminService.ts
 * @description Admin operations for user management via Cognito
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-12-01
 */

import { CognitoIdentityProviderClient, ListUsersCommand, AdminConfirmSignUpCommand, AdminDeleteUserCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '../utils/logger';

const ADMIN_EMAIL = 'tristanmarvin@outlook.com';

const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * Get user email from Cognito by user ID
 */
async function getUserEmail(userId: string): Promise<string> {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: getUserPoolId(),
      Username: userId,
    });
    const response = await cognitoClient.send(command);
    const emailAttr = response.UserAttributes?.find(attr => attr.Name === 'email');
    return emailAttr?.Value || '';
  } catch (error) {
    return '';
  }
}

/**
 * Check if user is admin
 */
async function isAdmin(userIdOrEmail: string): Promise<boolean> {
  // If it looks like an email, compare directly
  if (userIdOrEmail.includes('@')) {
    return userIdOrEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
  // Otherwise, fetch the email from Cognito
  const email = await getUserEmail(userIdOrEmail);
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get user pool ID from environment
 */
function getUserPoolId(): string {
  const userPoolId = process.env.USER_POOL_ID;
  if (!userPoolId) {
    throw new Error('USER_POOL_ID environment variable not set');
  }
  return userPoolId;
}

/**
 * List pending users (UNCONFIRMED status)
 */
export async function listPendingUsers(userEmail: string, logger: Logger): Promise<any[]> {
  logger.logEntry('listPendingUsers', { userEmail });
  
  if (!(await isAdmin(userEmail))) {
    logger.logError('listPendingUsers', new Error('Unauthorized'), { userEmail });
    throw new Error('Unauthorized: Admin access required');
  }
  
  try {
    const command = new ListUsersCommand({
      UserPoolId: getUserPoolId(),
      Filter: 'cognito:user_status = "UNCONFIRMED"',
    });
    
    const response = await cognitoClient.send(command);
    
    const users = (response.Users || []).map((user: any) => {
      const emailAttr = user.Attributes?.find((attr: any) => attr.Name === 'email');
      return {
        username: user.Username || '',
        email: emailAttr?.Value || '',
        status: user.UserStatus || '',
        createdDate: user.UserCreateDate?.toISOString() || '',
      };
    });
    
    logger.logExit('listPendingUsers', { count: users.length });
    return users;
  } catch (error) {
    logger.logError('listPendingUsers', error as Error);
    throw error;
  }
}

/**
 * List all users
 */
export async function listAllUsers(userEmail: string, logger: Logger): Promise<any[]> {
  logger.logEntry('listAllUsers', { userEmail });
  
  if (!(await isAdmin(userEmail))) {
    logger.logError('listAllUsers', new Error('Unauthorized'), { userEmail });
    throw new Error('Unauthorized: Admin access required');
  }
  
  try {
    const command = new ListUsersCommand({
      UserPoolId: getUserPoolId(),
    });
    
    const response = await cognitoClient.send(command);
    
    const users = (response.Users || []).map((user: any) => {
      const emailAttr = user.Attributes?.find((attr: any) => attr.Name === 'email');
      return {
        username: user.Username || '',
        email: emailAttr?.Value || '',
        status: user.UserStatus || '',
        createdDate: user.UserCreateDate?.toISOString() || '',
      };
    });
    
    logger.logExit('listAllUsers', { count: users.length });
    return users;
  } catch (error) {
    logger.logError('listAllUsers', error as Error);
    throw error;
  }
}

/**
 * Confirm a user (approve registration)
 */
export async function confirmUser(userEmail: string, username: string, logger: Logger): Promise<boolean> {
  logger.logEntry('confirmUser', { userEmail, username });
  
  if (!(await isAdmin(userEmail))) {
    logger.logError('confirmUser', new Error('Unauthorized'), { userEmail });
    throw new Error('Unauthorized: Admin access required');
  }
  
  try {
    const command = new AdminConfirmSignUpCommand({
      UserPoolId: getUserPoolId(),
      Username: username,
    });
    
    await cognitoClient.send(command);
    
    logger.logInfo('User confirmed successfully', { username });
    logger.logExit('confirmUser', { success: true });
    return true;
  } catch (error) {
    logger.logError('confirmUser', error as Error, { username });
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userEmail: string, username: string, logger: Logger): Promise<boolean> {
  logger.logEntry('deleteUser', { userEmail, username });
  
  if (!(await isAdmin(userEmail))) {
    logger.logError('deleteUser', new Error('Unauthorized'), { userEmail });
    throw new Error('Unauthorized: Admin access required');
  }
  
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: getUserPoolId(),
      Username: username,
    });
    
    await cognitoClient.send(command);
    
    logger.logInfo('User deleted successfully', { username });
    logger.logExit('deleteUser', { success: true });
    return true;
  } catch (error) {
    logger.logError('deleteUser', error as Error, { username });
    throw error;
  }
}
