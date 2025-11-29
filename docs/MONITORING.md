# CloudWatch Monitoring Guide

This guide covers the CloudWatch monitoring setup for the ERT Quiz App.

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-monitoring.sh
```

This will create:
- CloudWatch Dashboard with key metrics
- CloudWatch Alarms for error detection
- SNS Topic for alarm notifications

## Dashboard Metrics

The **ERT-Quiz-App** dashboard includes:

### 1. Lambda Invocations & Errors
- **Total Invocations**: Number of times the Lambda function is called
- **Errors**: Failed invocations
- **Throttles**: Requests rejected due to concurrency limits

**What to watch**: Sudden spikes in errors or throttles

### 2. Lambda Duration
- **Average**: Mean execution time
- **p50**: 50th percentile (median)
- **p95**: 95th percentile
- **p99**: 99th percentile (worst case)

**What to watch**: Duration approaching 30s timeout, or p99 > 25s

### 3. Lambda Concurrency
- **Concurrent Executions**: Number of simultaneous function executions

**What to watch**: Approaching account concurrency limits (default 1000)

### 4. Error Rate
- **Error Rate %**: Percentage of failed invocations

**What to watch**: Error rate > 5%

### 5. Recent Errors
- **Log Query**: Last 20 ERROR level log entries with context

**What to watch**: Patterns in error messages

## CloudWatch Alarms

### ERT-Lambda-HighErrorRate
- **Threshold**: > 5 errors in 5 minutes
- **Evaluation**: 2 consecutive periods
- **Action**: Send SNS notification

**Troubleshooting**:
1. Check CloudWatch Logs for error details
2. Verify MongoDB connection
3. Check for invalid GraphQL queries
4. Review recent code deployments

### ERT-Lambda-HighDuration
- **Threshold**: Average duration > 25 seconds
- **Evaluation**: 2 consecutive periods
- **Action**: Send SNS notification

**Troubleshooting**:
1. Check MongoDB query performance
2. Review indexes on collections
3. Check for large result sets
4. Consider increasing Lambda memory

### ERT-Lambda-NoInvocations
- **Threshold**: < 1 invocation in 1 hour
- **Evaluation**: 1 period
- **Action**: Send SNS notification

**Troubleshooting**:
1. Check if frontend is deployed
2. Verify AppSync API is accessible
3. Check authentication configuration
4. Review Lambda permissions

## Setting Up Email Notifications

Subscribe your email to receive alarm notifications:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:REGION:ACCOUNT_ID:ERT-Quiz-Alarms \
  --protocol email \
  --notification-endpoint your-email@example.com
```

Confirm the subscription by clicking the link in the confirmation email.

## Viewing Logs

### Via AWS Console

1. Go to CloudWatch Console
2. Navigate to Log Groups
3. Find `/aws/lambda/YOUR_FUNCTION_NAME`
4. Click on log streams to view entries

### Via AWS CLI

```bash
# Get recent logs
aws logs tail /aws/lambda/YOUR_FUNCTION_NAME --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/YOUR_FUNCTION_NAME \
  --filter-pattern "ERROR"
```

### Using CloudWatch Insights

Run queries against structured JSON logs:

```sql
-- Find all errors in last hour
fields @timestamp, level, message, context.userId, context.examNumber
| filter level = "ERROR"
| sort @timestamp desc
| limit 50

-- Average duration by operation
fields @timestamp, message, duration
| filter message like /EXIT/
| stats avg(duration) by message

-- Most common errors
fields @timestamp, message, context.error
| filter level = "ERROR"
| stats count() by context.error
| sort count desc

-- Slow operations (>5s)
fields @timestamp, message, duration, context
| filter message like /EXIT/ and duration > 5000
| sort duration desc

-- User activity
fields @timestamp, message, context.userId
| filter message like /ENTRY/
| stats count() by context.userId
| sort count desc
```

## Performance Optimization

### If Duration is High

1. **Check MongoDB Indexes**:
   ```javascript
   // Ensure these indexes exist
   db.questions.createIndex({ examNumber: 1, subDomain: 1 })
   db.userProgress.createIndex({ userId: 1, state: 1 })
   db.userProgress.createIndex({ uniqueIndex: 1 }, { unique: true })
   db.quizSessions.createIndex({ sessionId: 1, userId: 1 })
   ```

2. **Increase Lambda Memory**: More memory = more CPU
   - Edit `amplify/functions/mongo-connector/resource.ts`
   - Increase `memoryMB` from 512 to 1024 or 2048

3. **Optimize Queries**:
   - Use projection to limit returned fields
   - Add `.lean()` to Mongoose queries
   - Cache frequently accessed data

### If Error Rate is High

1. **Check MongoDB Connection**:
   - Verify MONGO_URI is correct
   - Check MongoDB Atlas IP whitelist
   - Verify database credentials

2. **Review Recent Changes**:
   - Check recent deployments
   - Review code changes
   - Verify environment variables

3. **Check Authentication**:
   - Verify Cognito configuration
   - Check JWT token validation
   - Review user permissions

## Cost Optimization

### CloudWatch Costs

- **Logs**: $0.50 per GB ingested
- **Dashboards**: $3 per dashboard per month
- **Alarms**: $0.10 per alarm per month
- **Insights Queries**: $0.005 per GB scanned

### Reducing Costs

1. **Set Log Retention**:
   ```bash
   aws logs put-retention-policy \
     --log-group-name /aws/lambda/YOUR_FUNCTION_NAME \
     --retention-in-days 7
   ```

2. **Filter Logs**: Only log important events
   - Use INFO for normal operations
   - Use ERROR for failures
   - Avoid DEBUG in production

3. **Use Metric Filters**: Extract metrics from logs instead of custom metrics

## Monitoring Checklist

- [ ] Dashboard created and accessible
- [ ] Alarms configured and tested
- [ ] Email notifications subscribed
- [ ] Log retention policy set
- [ ] Baseline metrics established
- [ ] Team trained on dashboard usage
- [ ] Runbook created for common issues

## Troubleshooting Common Issues

### Dashboard Not Showing Data

**Problem**: Dashboard widgets are empty

**Solution**:
1. Verify Lambda function name is correct
2. Check that function has been invoked at least once
3. Wait 5-10 minutes for metrics to populate
4. Verify AWS region matches function region

### Alarms Not Triggering

**Problem**: Alarms stay in "Insufficient Data" state

**Solution**:
1. Invoke the Lambda function to generate metrics
2. Check alarm threshold is appropriate
3. Verify alarm dimensions match function name
4. Review alarm configuration in CloudWatch console

### High Costs

**Problem**: CloudWatch costs are unexpectedly high

**Solution**:
1. Check log volume in CloudWatch Logs
2. Set log retention to 7 days
3. Reduce log verbosity (remove DEBUG logs)
4. Review Insights query frequency
5. Consider sampling logs in high-traffic scenarios

## Additional Resources

- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Lambda Monitoring Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/)
