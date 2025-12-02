# Troubleshooting Guide - Exam Readiness Tracker (ERT)

## Architecture Overview

Understanding the system architecture helps diagnose issues:

```
User Browser
    ↓ HTTPS
AWS Amplify Hosting (Frontend)
    ↓ GraphQL/HTTPS
AWS AppSync (GraphQL API)
    ↓ Invoke
AWS Lambda (Business Logic)
    ↓ TLS/SSL
MongoDB Atlas (Database)

AWS Cognito (Authentication)
    ↓ JWT Tokens
AppSync → Lambda
```

**Key Components:**
- **Cognito** - User authentication and management
- **Amplify Hosting** - Serves React frontend
- **AppSync** - GraphQL API gateway
- **Lambda** - Node.js/TypeScript business logic
- **MongoDB Atlas** - Question and progress data

---

## Common Issues and Solutions

### 1. Users Can't Sign Up

**Symptoms:**
- Error message during signup
- Verification code not sent
- "User pool client does not exist" error

**Diagnosis:**
```bash
# Check Cognito user pool status
aws cognito-idp describe-user-pool --user-pool-id <USER_POOL_ID>

# List user pool clients
aws cognito-idp list-user-pool-clients --user-pool-id <USER_POOL_ID>
```

**Solutions:**
- Verify Cognito user pool is active in AWS Console
- Check `amplify_outputs.json` has correct user pool ID
- Redeploy backend: `cd front-end && npx ampx pipeline-deploy --branch main --app-id <APP_ID>`
- Check CloudWatch logs for Cognito errors

---

### 2. Questions Not Loading

**Symptoms:**
- Empty exam dropdown
- "No data available" message
- Quiz won't start

**Diagnosis:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 10m --format short

# Look for database connection errors
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 10m --format short | grep "DATABASE_ERROR\|MongoError"
```

**Solutions:**

**A. MongoDB Connection Issues:**
```bash
# Verify MONGO_URI secret is set
cd front-end
npx ampx sandbox secret list

# Set/update MongoDB connection string
npx ampx sandbox secret set MONGO_URI
# Paste: mongodb+srv://username:password@cluster.mongodb.net/aws-quiz-db
```

**B. Check MongoDB Atlas:**
- Log in to MongoDB Atlas
- Verify cluster is running
- Check IP whitelist (should include 0.0.0.0/0 for Lambda)
- Verify database user has readWrite permissions

**C. Verify Questions Exist:**
```bash
# Connect to MongoDB and check
mongosh "mongodb+srv://..." --eval "db.questions.countDocuments()"
```

---

### 3. Admin Panel Errors

**Symptoms:**
- "Unauthorized: Admin access required"
- "Internal error" when loading admin panel
- Can't see pending users

**Diagnosis:**
```bash
# Check Lambda logs for admin operations
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 10m --format short | grep "listPendingUsers\|listAllUsers"
```

**Solutions:**

**A. Verify Admin Email:**
Check `front-end/amplify/functions/mongo-connector/services/adminService.ts`:
```typescript
const ADMIN_EMAIL = 'tristanmarvin@outlook.com';
```

**B. Check IAM Permissions:**
Lambda needs Cognito admin permissions. Verify in `front-end/amplify/backend.ts`:
```typescript
actions: [
  'cognito-idp:ListUsers',
  'cognito-idp:AdminConfirmSignUp',
  'cognito-idp:AdminDeleteUser',
  'cognito-idp:AdminGetUser',
]
```

**C. Verify USER_POOL_ID Environment Variable:**
```bash
# Check Lambda environment variables
aws lambda get-function-configuration --function-name amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --query 'Environment.Variables.USER_POOL_ID'
```

---

### 4. Deployment Failures

**Symptoms:**
- Build fails in Amplify Console
- "amplify_outputs.json not found" error
- TypeScript compilation errors

**Diagnosis:**
Check Amplify Console build logs for specific errors.

**Solutions:**

**A. Backend Not Deployed First:**
Verify `amplify.yml` has backend phase:
```yaml
backend:
  phases:
    build:
      commands:
        - cd front-end
        - npm ci
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID --outputs-out-dir ../
```

**B. TypeScript Errors:**
```bash
# Check locally
cd front-end
npm run build
```

Fix any TypeScript errors before pushing.

**C. Missing Dependencies:**
```bash
# Reinstall dependencies
cd front-end
rm -rf node_modules package-lock.json
npm install
```

---

### 5. Slow Performance

**Symptoms:**
- Questions take long to load
- Dashboard slow to render
- Timeouts

**Diagnosis:**
```bash
# Check Lambda duration
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short | grep "Duration:"

# Check for cold starts
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short | grep "INIT_START"
```

**Solutions:**

**A. Increase Lambda Memory:**
Edit `front-end/amplify/functions/mongo-connector.ts`:
```typescript
memoryMB: 1024, // Increase from 512
```

**B. Optimize MongoDB Queries:**
- Add indexes for frequently queried fields
- Use projection to fetch only needed fields
- Check MongoDB Atlas performance metrics

**C. Enable Connection Pooling:**
Already implemented - Lambda reuses MongoDB connections.

---

### 6. User Progress Not Saving

**Symptoms:**
- Quiz progress resets
- Dashboard shows no progress
- Questions repeat as "New"

**Diagnosis:**
```bash
# Check for progress update errors
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 10m --format short | grep "submitAnswer\|UserProgress"
```

**Solutions:**

**A. Verify User ID:**
Progress is tied to Cognito user ID. Check logs show correct userId.

**B. Check MongoDB Indexes:**
```javascript
// In MongoDB shell
db.userProgress.getIndexes()
// Should have index on: { uniqueIndex: 1 }
```

**C. Check for Race Conditions:**
Multiple rapid submissions might cause issues. Verify atomic updates in code.

---

## Useful Commands

### CloudWatch Logs

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --follow

# View last hour of logs
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short

# Search for specific errors
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short | grep "ERROR"

# Filter by function name
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short | grep "getExams"

# View logs for specific time range
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 2024-12-01T10:00:00 --until 2024-12-01T11:00:00
```

### User Management

```bash
# List all users
./scripts/manage-users.sh list

# List pending users
./scripts/manage-users.sh pending

# Confirm user
./scripts/manage-users.sh confirm user@example.com

# Delete user
./scripts/manage-users.sh delete user@example.com
```

### MongoDB

```bash
# Connect to MongoDB
mongosh "mongodb+srv://username:password@cluster.mongodb.net/aws-quiz-db"

# Count questions
db.questions.countDocuments()

# Count by exam
db.questions.countDocuments({ examNumber: "SCS-C02" })

# View user progress
db.userProgress.find({ userId: "USER_ID" }).limit(10)

# Check quiz sessions
db.quizSessions.find().sort({ createdAt: -1 }).limit(5)
```

### Amplify

```bash
# Start sandbox
cd front-end
npx ampx sandbox

# Delete sandbox
npx ampx sandbox delete

# Set secret
npx ampx sandbox secret set MONGO_URI

# List secrets
npx ampx sandbox secret list

# Deploy to production
git push origin main
```

### Local Development

```bash
# Start dev server
cd front-end
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Checking System Health

### 1. Verify All Services

```bash
# Check Cognito user pool
aws cognito-idp describe-user-pool --user-pool-id <USER_POOL_ID>

# Check Lambda function
aws lambda get-function --function-name amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO

# Check AppSync API
aws appsync list-graphql-apis

# Test MongoDB connection
mongosh "mongodb+srv://..." --eval "db.adminCommand('ping')"
```

### 2. Test End-to-End

1. Sign up with test account
2. Verify email
3. Log in
4. Load dashboard (checks MongoDB connection)
5. Start quiz (checks question retrieval)
6. Answer question (checks progress update)
7. Check admin panel (checks Cognito integration)

---

## Error Messages Reference

### "Invalid scheme, expected connection string to start with mongodb://"
- **Cause:** MONGO_URI secret is not set or invalid
- **Fix:** Set correct MongoDB connection string

### "User pool client does not exist"
- **Cause:** Frontend using old Cognito client ID
- **Fix:** Redeploy backend and frontend

### "Unauthorized: Admin access required"
- **Cause:** User email doesn't match ADMIN_EMAIL or Lambda can't fetch email
- **Fix:** Verify admin email in code and IAM permissions

### "Failed to connect to database"
- **Cause:** MongoDB connection issue
- **Fix:** Check MONGO_URI, MongoDB Atlas status, IP whitelist

### "Could not resolve amplify_outputs.json"
- **Cause:** Backend not deployed before frontend build
- **Fix:** Update amplify.yml to deploy backend first

---

## Getting Help

1. **Check this guide** for common issues
2. **Review CloudWatch logs** for specific errors
3. **Check AWS Amplify Console** for deployment status
4. **Verify MongoDB Atlas** cluster health
5. **Test locally** with sandbox environment
6. **Review code changes** that might have caused issues

---

## Preventive Maintenance

### Weekly
- Review CloudWatch logs for errors
- Check MongoDB Atlas metrics
- Monitor user signups and activity

### Monthly
- Update npm dependencies
- Review and archive old quiz sessions
- Check AWS costs and usage
- Backup MongoDB data

### Quarterly
- Security audit (update passwords, review IAM permissions)
- Performance review (optimize slow queries)
- User feedback review (plan new features)

---

**Last Updated:** December 2024
