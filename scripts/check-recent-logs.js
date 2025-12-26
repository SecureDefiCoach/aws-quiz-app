#!/usr/bin/env node

/**
 * Check recent CloudWatch logs for startQuiz attempts
 */

const { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, GetLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

async function checkRecentLogs() {
  const client = new CloudWatchLogsClient({ region: 'us-east-1' });
  
  try {
    console.log('🔍 Checking Recent CloudWatch Logs for startQuiz');
    console.log('===============================================');
    
    // Find log groups related to mongo-connector
    const logGroups = await client.send(new DescribeLogGroupsCommand({
      logGroupNamePrefix: '/aws/lambda'
    }));
    
    const mongoLogGroup = logGroups.logGroups?.find(lg => 
      lg.logGroupName?.includes('mongo-connector')
    );
    
    if (!mongoLogGroup) {
      console.log('❌ No mongo-connector log group found');
      return;
    }
    
    console.log(`📋 Found log group: ${mongoLogGroup.logGroupName}`);
    
    // Get recent log streams
    const streams = await client.send(new DescribeLogStreamsCommand({
      logGroupName: mongoLogGroup.logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 5
    }));
    
    if (!streams.logStreams || streams.logStreams.length === 0) {
      console.log('❌ No log streams found');
      return;
    }
    
    console.log(`📋 Checking ${streams.logStreams.length} recent log streams`);
    
    // Check recent events in the most recent streams
    for (const stream of streams.logStreams.slice(0, 2)) {
      console.log(`\n📋 Stream: ${stream.logStreamName}`);
      
      const events = await client.send(new GetLogEventsCommand({
        logGroupName: mongoLogGroup.logGroupName,
        logStreamName: stream.logStreamName,
        startTime: Date.now() - (60 * 60 * 1000), // Last hour
        limit: 100
      }));
      
      if (!events.events || events.events.length === 0) {
        console.log('  📋 No recent events');
        continue;
      }
      
      // Look for startQuiz related events
      const relevantEvents = events.events.filter(event => 
        event.message?.includes('startQuiz') || 
        event.message?.includes('EVER_WRONG') ||
        event.message?.includes('84984478-40b1-703d-53d0-aef7aad3a874') ||
        event.message?.includes('94c8f4e8-8091-7016-8a4c-eac76ff5ea36')
      );
      
      if (relevantEvents.length > 0) {
        console.log(`  ✅ Found ${relevantEvents.length} relevant events:`);
        relevantEvents.forEach((event, index) => {
          const timestamp = new Date(event.timestamp || 0).toISOString();
          console.log(`    ${index + 1}. [${timestamp}] ${event.message}`);
        });
      } else {
        console.log('  📋 No startQuiz events found in this stream');
      }
    }
    
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`   1. Try to start an "Ever Wrong" quiz on your iPad now`);
    console.log(`   2. Run this script again to see the logs`);
    console.log(`   3. We'll see what user ID your iPad is actually sending`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecentLogs().catch(console.error);