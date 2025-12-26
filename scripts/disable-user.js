#!/usr/bin/env node

const { CognitoIdentityProviderClient, AdminDisableUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function disableUser() {
  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
  
  try {
    console.log('🔍 Looking for users to disable...\n');
    
    // List all users to see what we have
    const listCommand = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    });
    
    const listResult = await client.send(listCommand);
    
    if (!listResult.Users) {
      console.log('❌ No users found');
      return;
    }
    
    console.log('👥 Current users:');
    listResult.Users.forEach(user => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const sub = user.Attributes?.find(attr => attr.Name === 'sub')?.Value;
      console.log(`   - ${email} (${user.UserStatus})`);
      console.log(`     Username: ${user.Username}`);
      console.log(`     Sub: ${sub}`);
      console.log('');
    });
    
    // Find users that are NOT aemjk4h@protonmail.com
    const usersToDisable = listResult.Users.filter(user => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      return email && email !== 'aemjk4h@protonmail.com' && email !== 'tristanmarvin@outlook.com';
    });
    
    if (usersToDisable.length === 0) {
      console.log('✅ No users need to be disabled');
      return;
    }
    
    console.log(`🎯 Users to disable: ${usersToDisable.length}`);
    
    for (const user of usersToDisable) {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      console.log(`🔒 Disabling user: ${email}`);
      
      if (user.UserStatus === 'CONFIRMED') {
        const disableCommand = new AdminDisableUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: user.Username
        });
        
        await client.send(disableCommand);
        console.log(`✅ Successfully disabled ${email}`);
      } else {
        console.log(`⚠️  User ${email} is already ${user.UserStatus}`);
      }
    }
    
    console.log('\n✅ User management completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

disableUser();