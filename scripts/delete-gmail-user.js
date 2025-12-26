#!/usr/bin/env node

const { CognitoIdentityProviderClient, AdminDeleteUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function deleteGmailUser() {
  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
  
  try {
    console.log('🔍 Looking for aemjk4h@gmail.com user...\n');
    
    // First, list users to find the gmail one
    const listCommand = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Filter: 'email = "aemjk4h@gmail.com"'
    });
    
    const listResult = await client.send(listCommand);
    
    if (!listResult.Users || listResult.Users.length === 0) {
      console.log('❌ User aemjk4h@gmail.com not found');
      return;
    }
    
    const user = listResult.Users[0];
    console.log('✅ Found user:', {
      username: user.Username,
      email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
      status: user.UserStatus
    });
    
    // Delete the user
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: user.Username
    });
    
    await client.send(deleteCommand);
    console.log('✅ Successfully deleted aemjk4h@gmail.com');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteGmailUser();