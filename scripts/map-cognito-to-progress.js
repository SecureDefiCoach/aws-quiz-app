#!/usr/bin/env node

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function mapCognitoToProgress() {
  const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
  const mongoClient = new MongoClient(process.env.MONGO_URI);
  
  try {
    console.log('🔍 Mapping Cognito users to progress data...\n');
    
    // Get Cognito users
    const listCommand = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    });
    
    const cognitoResult = await cognitoClient.send(listCommand);
    
    if (!cognitoResult.Users) {
      console.log('❌ No Cognito users found');
      return;
    }
    
    console.log('👥 Cognito Users:');
    cognitoResult.Users.forEach(user => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const sub = user.Attributes?.find(attr => attr.Name === 'sub')?.Value;
      console.log(`   - ${email}`);
      console.log(`     Status: ${user.UserStatus}`);
      console.log(`     Username: ${user.Username}`);
      console.log(`     Sub (User ID): ${sub}`);
      console.log('');
    });
    
    // Get MongoDB progress data
    await mongoClient.connect();
    const db = mongoClient.db('aws-quiz-db');
    const userProgress = db.collection('userProgress');
    
    const allProgress = await userProgress.find({}).toArray();
    
    // Group by user ID
    const userGroups = {};
    allProgress.forEach(p => {
      if (!userGroups[p.userId]) {
        userGroups[p.userId] = [];
      }
      userGroups[p.userId].push(p);
    });
    
    console.log('📊 MongoDB Progress Data:');
    for (const [userId, records] of Object.entries(userGroups)) {
      const wrongRecords = records.filter(r => r.wrongCount > 0);
      console.log(`   - User ID: ${userId}`);
      console.log(`     Total Records: ${records.length}`);
      console.log(`     Wrong Count > 0: ${wrongRecords.length}`);
      
      // Check if this matches any Cognito user
      const matchingCognitoUser = cognitoResult.Users?.find(user => {
        const sub = user.Attributes?.find(attr => attr.Name === 'sub')?.Value;
        return sub === userId;
      });
      
      if (matchingCognitoUser) {
        const email = matchingCognitoUser.Attributes?.find(attr => attr.Name === 'email')?.Value;
        console.log(`     ✅ Matches Cognito user: ${email}`);
      } else {
        console.log(`     ❌ No matching Cognito user found`);
      }
      console.log('');
    }
    
    // Identify the issue
    console.log('🎯 Analysis:');
    const aemjk4hCognitoUser = cognitoResult.Users?.find(user => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      return email === 'aemjk4h@protonmail.com';
    });
    
    if (aemjk4hCognitoUser) {
      const aemjk4hSub = aemjk4hCognitoUser.Attributes?.find(attr => attr.Name === 'sub')?.Value;
      console.log(`   aemjk4h@protonmail.com Cognito Sub: ${aemjk4hSub}`);
      
      const aemjk4hProgress = userGroups[aemjk4hSub || ''];
      if (aemjk4hProgress) {
        console.log(`   ✅ Progress data exists for this user: ${aemjk4hProgress.length} records`);
      } else {
        console.log(`   ❌ No progress data for this Cognito user`);
        console.log(`   🔧 Need to migrate progress data to this user ID`);
      }
    }
    
    console.log('\n✅ Mapping completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoClient.close();
  }
}

mapCognitoToProgress();