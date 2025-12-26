#!/usr/bin/env node

const { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, GetLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

async function checkCloudWatchLogs() {
  const client = new CloudWatchLogsClient({ region: 'us-east-1' });
  
  try {
    console.log('🔍 Looking for Lambda function logs...\n');
    
    // First, find the log group
    const logGroupsCommand = new DescribeLogGroupsCommand({
      logGroupNamePrefix: '/aws/lambda/'
    });
    
    const logGroups = await client.send(logGroupsCommand);
    
    console.log('📋 Available Log Groups:');
    logGroups.logGroups?.forEach(group => {
      console.log(`   - ${group.logGroupName}`);
    });
    
    // Look for the mongo-connector function
    const mongoLogGroup = logGroups.logGroups?.find(group => 
      group.logGroupName?.includes('mongo-connector')
    );
    
    if (!mongoLogGroup) {
      console.log('❌ No mongo-connector log group found');
      return;
    }
    
    console.log(`\n🎯 Using log group: ${mongoLogGroup.logGroupName}`);
    
    // Get recent log streams
    const logStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName: mongoLogGroup.logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 5
    });
    
    const logStreams = await client.send(logStreamsCommand);
    
    if (!logStreams.logStreams || logStreams.logStreams.length === 0) {
      console.log('❌ No log streams found');
      return;
    }
    
    console.log(`\n📊 Found ${logStreams.logStreams.length} recent log streams`);
    
    // Get events from the most recent stream
    const recentStream = logStreams.logStreams[0];
    console.log(`\n🔍 Checking stream: ${recentStream.logStreamName}`);
    
    const logEventsCommand = new GetLogEventsCommand({
      logGroupName: mongoLogGroup.logGroupName,
      logStreamName: recentStream.logStreamName,
      limit: 50,
      startFromHead: false
    });
    
    const logEvents = await client.send(logEventsCommand);
    
    if (!logEvents.events || logEvents.events.length === 0) {
      console.log('❌ No log events found');
      return;
    }
    
    console.log(`\n📝 Recent log events (${logEvents.events.length}):`);
    
    // Filter for relevant events
    const relevantEvents = logEvents.events.filter(event => 
      event.message?.includes('quiz-resolver') || 
      event.message?.includes('startQuiz') ||
      event.message?.includes('userId') ||
      event.message?.includes('ENTRY') ||
      event.message?.includes('ERROR')
    );
    
    if (relevantEvents.length === 0) {
      console.log('❌ No relevant events found. Showing last 10 events:');
      logEvents.events.slice(-10).forEach(event => {
        const timestamp = new Date(event.timestamp || 0).toISOString();
        console.log(`   [${timestamp}] ${event.message}`);
      });
    } else {
      console.log(`\n🎯 Relevant events (${relevantEvents.length}):`);
      relevantEvents.forEach(event => {
        const timestamp = new Date(event.timestamp || 0).toISOString();
        console.log(`   [${timestamp}] ${event.message}`);
      });
    }
    
    console.log('\n✅ Log check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCloudWatchLogs();