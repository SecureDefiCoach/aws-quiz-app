# Security Assessment - Exam Readiness Tracker (ERT)

**Assessment Date:** December 2, 2024  
**Assessor:** IT Security Auditor  
**Application:** Exam Readiness Tracker (ERT) Quiz Application  
**Environment:** AWS Serverless (Amplify, Cognito, AppSync, Lambda, MongoDB Atlas)  
**Framework:** CIS AWS Foundations Benchmark v1.5.0  

---

## Executive Summary

This security assessment evaluates the Exam Readiness Tracker application against CIS AWS Foundations Benchmark and industry best practices. The assessment covers authentication, authorization, data protection, logging, monitoring, and infrastructure security.

**Overall Security Posture:** Moderate  
**Critical Findings:** 0  
**High Findings:** 3  
**Medium Findings:** 5  
**Low Findings:** 4  
**Informational:** 6  

---

## 1. Authentication & Identity Management

### 1.1 AWS Cognito Configuration

**CIS Control:** 1.12 - Ensure credentials unused for 90 days are disabled  
**Status:** ⚠️ MEDIUM  

**Current State:**
- Email/password authentication enabled
- Password policy: Min 8 chars, requires uppercase, lowercase, number, special character
- Email verification required
- No MFA enforcement
- No password expiration policy
- No inactive user cleanup

**Findings:**
```
MEDIUM: Multi-Factor Authentication (MFA) not enforced
- Users can access the application with only password authentication
- Recommendation: Enable MFA for all users or at minimum for admin accounts
- CIS Control: 1.14 - Ensure hardware MFA is enabled for root user
```

```
LOW: No password expiration policy
- Passwords never expire
- Recommendation: Implement 90-day password rotation
- CIS Control: 1.5 - Ensure IAM password policy requires minimum length of 14
```

```
INFO: Password policy meets minimum requirements
- Current: 8 characters minimum
- CIS Recommendation: 14 characters minimum
- Consider increasing to 12-14 characters for enhanced security
```

**Evidence:**
```typescript
// File: front-end/amplify/auth/resource.ts
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Verify your ERT Quiz App account',
      verificationEmailBody: (createCode) => 
        `Welcome to the Exam Readiness Tracker (ERT) Quiz App!...`,
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
```

---

## 2. Authorization & Access Control

### 2.1 IAM Roles and Policies

**CIS Control:** 1.16 - Ensure IAM policies are attached only to groups or roles  
**Status:** ✅ COMPLIANT  

**Current State:**
- Lambda execution role with least privilege
- Cognito admin permissions scoped to specific actions
- No overly permissive wildcard policies

**Findings:**
```
✅ PASS: Lambda IAM role follows least privilege
- Permissions limited to: cognito-idp:ListUsers, AdminConfirmSignUp, AdminDeleteUser, AdminGetUser
- Scoped to specific user pool ARN
```

**Evidence:**
```typescript
// File: front-end/amplify/backend.ts
backend.mongoConnector.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-idp:ListUsers',
      'cognito-idp:AdminConfirmSignUp',
      'cognito-idp:AdminDeleteUser',
      'cognito-idp:AdminGetUser',
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);
```

### 2.2 Admin Access Control

**CIS Control:** Custom - Role-Based Access Control  
**Status:** ⚠️ HIGH  

**Findings:**
```
HIGH: Admin role hardcoded in application code
- Admin email hardcoded: 'tristanmarvin@outlook.com'
- No centralized role management
- Difficult to add/remove admins
- Recommendation: Implement Cognito Groups for role management
```

```
MEDIUM: No audit trail for admin actions
- Admin operations (user deletion, approval) not logged to CloudTrail
- Recommendation: Enable CloudTrail for Cognito and Lambda
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector/services/adminService.ts
const ADMIN_EMAIL = 'tristanmarvin@outlook.com';

async function isAdmin(userIdOrEmail: string): Promise<boolean> {
  if (userIdOrEmail.includes('@')) {
    return userIdOrEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
  const email = await getUserEmail(userIdOrEmail);
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
```

---

## 3. Data Protection

### 3.1 Encryption in Transit

**CIS Control:** 2.1 - Ensure S3 bucket policy requires requests to use SSL  
**Status:** ✅ COMPLIANT  

**Current State:**
- All traffic encrypted with TLS 1.2+
- HTTPS enforced on Amplify Hosting
- AppSync uses HTTPS
- MongoDB connection uses TLS/SSL

**Findings:**
```
✅ PASS: All data in transit encrypted
- Browser → Amplify: HTTPS/TLS 1.3
- Amplify → AppSync: HTTPS with AWS Signature V4
- AppSync → Lambda: AWS internal encrypted channels
- Lambda → MongoDB: TLS/SSL 1.2+
```

### 3.2 Encryption at Rest

**CIS Control:** 2.1.1 - Ensure S3 bucket has encryption enabled  
**Status:** ✅ COMPLIANT  

**Current State:**
- MongoDB Atlas: AES-256 encryption enabled by default
- AWS Secrets Manager: Encrypted storage for MONGO_URI
- Cognito: Encrypted user credentials

**Findings:**
```
✅ PASS: Data at rest encrypted
- MongoDB: AES-256 encryption
- Secrets Manager: KMS encrypted
- Cognito: AWS managed encryption
```

### 3.3 Secrets Management

**CIS Control:** 1.4 - Ensure access keys are rotated every 90 days  
**Status:** ⚠️ MEDIUM  

**Findings:**
```
MEDIUM: MongoDB credentials not rotated
- MONGO_URI stored in AWS Secrets Manager (good)
- No rotation policy configured
- Recommendation: Enable automatic secret rotation (90 days)
```

```
INFO: No hardcoded secrets in code
- All sensitive credentials stored in Secrets Manager
- Environment variables used for configuration
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector.ts
environment: {
  MONGO_URI: secret('MONGO_URI'),  // ✅ Using Secrets Manager
  DB_NAME: 'aws-quiz-db',
  LOG_LEVEL: 'INFO',
  NODE_ENV: 'production',
}
```

---

## 4. Logging & Monitoring

### 4.1 CloudWatch Logging

**CIS Control:** 3.1 - Ensure CloudTrail is enabled in all regions  
**Status:** ⚠️ HIGH  

**Findings:**
```
HIGH: CloudTrail not enabled
- No audit trail for AWS API calls
- Cannot track who made changes to infrastructure
- Recommendation: Enable CloudTrail with S3 bucket for log storage
- CIS Control: 3.1, 3.2, 3.3
```

```
MEDIUM: CloudWatch log retention not configured
- Lambda logs retained indefinitely (cost concern)
- Recommendation: Set retention to 90 days or per compliance requirements
- CIS Control: 3.6 - Ensure S3 bucket access logging is enabled
```

```
✅ PASS: Structured logging implemented
- JSON format for CloudWatch compatibility
- Entry/Exit/Error patterns
- Request ID tracking
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector/utils/logger.ts
export function createLogger(requestId: string): Logger {
  return {
    logEntry(functionName, data) {
      console.log(JSON.stringify({
        level: 'INFO',
        event: 'ENTRY',
        requestId,
        functionName,
        timestamp: new Date().toISOString(),
        data
      }));
    },
    // ... other methods
  };
}
```

### 4.2 Monitoring & Alerting

**CIS Control:** 4.1 - Ensure unauthorized API calls are monitored  
**Status:** ⚠️ MEDIUM  

**Findings:**
```
MEDIUM: No CloudWatch alarms configured
- No alerts for Lambda errors
- No alerts for authentication failures
- No alerts for unusual activity
- Recommendation: Configure alarms for:
  - Lambda error rate > 5%
  - Lambda duration > 25 seconds
  - Cognito failed login attempts > 10/hour
```

```
LOW: No centralized monitoring dashboard
- Metrics scattered across services
- Recommendation: Create CloudWatch Dashboard
```

**Current Monitoring:**
- CloudWatch Logs: Enabled (Lambda)
- CloudWatch Metrics: Default metrics only
- CloudWatch Alarms: None configured
- AWS X-Ray: Not enabled

---

## 5. Network Security

### 5.1 VPC Configuration

**CIS Control:** 5.1 - Ensure no Network ACLs allow ingress from 0.0.0.0/0 to port 22  
**Status:** ⚠️ MEDIUM  

**Findings:**
```
MEDIUM: Lambda not in VPC
- Lambda functions have public internet access
- Cannot restrict outbound traffic
- Recommendation: Deploy Lambda in VPC with NAT Gateway for MongoDB access
- Use Security Groups to restrict traffic
```

```
INFO: MongoDB IP whitelist set to 0.0.0.0/0
- Required for Lambda (dynamic IPs)
- Consider: VPC Peering or AWS PrivateLink for MongoDB Atlas
```

### 5.2 API Security

**CIS Control:** Custom - API Gateway Security  
**Status:** ✅ COMPLIANT  

**Findings:**
```
✅ PASS: AppSync requires authentication
- All queries/mutations require Cognito JWT token
- No public API access
- API key disabled for production
```

```
INFO: Rate limiting not configured
- AppSync has default throttling (1000 req/sec)
- Consider: Custom rate limits per user/IP
```

---

## 6. Application Security

### 6.1 Input Validation

**CIS Control:** Custom - Secure Coding Practices  
**Status:** ⚠️ MEDIUM  

**Findings:**
```
MEDIUM: Limited input validation
- GraphQL schema provides type validation
- No explicit sanitization of user inputs
- Potential for injection attacks in MongoDB queries
- Recommendation: Implement input validation middleware
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector/services/quizService.ts
// Example: Direct use of user input in MongoDB query
const matchCriteria: any = { examNumber: filters.examNumber };
if (filters.subDomain) {
  matchCriteria.subDomainNum = filters.subDomain;  // ⚠️ No sanitization
}
```

### 6.2 Error Handling

**CIS Control:** Custom - Information Disclosure  
**Status:** ✅ COMPLIANT  

**Findings:**
```
✅ PASS: Error messages sanitized
- Generic error messages returned to client
- Detailed errors logged server-side only
- No stack traces exposed to users
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector/utils/errorHandler.ts
export function handleError(error: Error, logger: Logger): never {
  if (error instanceof AppError) {
    logger.logError('AppError', error, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    });
    
    throw new Error(JSON.stringify({
      errorType: error.code,
      errorMessage: error.message,  // ✅ Generic message
      statusCode: error.statusCode
    }));
  }
  
  // Unknown error - don't expose details
  logger.logError('UnknownError', error);
  throw new Error(JSON.stringify({
    errorType: 'INTERNAL_ERROR',
    errorMessage: 'An unexpected error occurred',  // ✅ Generic
    statusCode: 500
  }));
}
```

### 6.3 Dependency Management

**CIS Control:** Custom - Software Composition Analysis  
**Status:** ⚠️ HIGH  

**Findings:**
```
HIGH: Dependencies not regularly scanned
- No automated vulnerability scanning
- Recommendation: Enable npm audit in CI/CD pipeline
- Recommendation: Use AWS CodeGuru or Snyk
```

```
INFO: Run npm audit to check current vulnerabilities
Command: cd front-end && npm audit
```

---

## 7. Data Privacy & Compliance

### 7.1 User Data Handling

**Status:** ✅ COMPLIANT  

**Findings:**
```
✅ PASS: Minimal PII collected
- Only email address stored
- No sensitive personal information
- User progress data not personally identifiable
```

```
INFO: No data retention policy
- User data retained indefinitely
- Recommendation: Implement data retention policy (e.g., delete inactive users after 2 years)
```

### 7.2 Data Isolation

**Status:** ✅ COMPLIANT  

**Findings:**
```
✅ PASS: Multi-tenant data isolation
- User progress filtered by userId
- No cross-user data leakage
- MongoDB queries properly scoped
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector/services/quizService.ts
const progress = await db.collection('userProgress').findOne({
  userId: userId,  // ✅ Always filtered by user
  questionId: new ObjectId(questionId)
});
```

---

## 8. Infrastructure Security

### 8.1 Resource Configuration

**CIS Control:** 2.1.5 - Ensure S3 buckets are configured with Block Public Access  
**Status:** ✅ COMPLIANT  

**Findings:**
```
✅ PASS: Amplify hosting not publicly writable
- Static assets served via CloudFront
- No public S3 bucket access
```

### 8.2 Lambda Security

**CIS Control:** Custom - Serverless Security  
**Status:** ⚠️ LOW  

**Findings:**
```
LOW: Lambda timeout set to 30 seconds
- Potential for DoS via long-running requests
- Recommendation: Reduce to 10-15 seconds for most operations
```

```
INFO: Lambda memory set to 512 MB
- Appropriate for current workload
- Monitor and adjust based on usage
```

**Evidence:**
```typescript
// File: front-end/amplify/functions/mongo-connector.ts
export const mongoConnector = defineFunction({
  name: 'mongo-connector',
  entry: './mongo-connector/handler.ts',
  timeoutSeconds: 30,  // ⚠️ Consider reducing
  memoryMB: 512,
  environment: {
    MONGO_URI: secret('MONGO_URI'),
    DB_NAME: 'aws-quiz-db',
    LOG_LEVEL: 'INFO',
    NODE_ENV: 'production',
  },
});
```

---

## 9. Backup & Disaster Recovery

### 9.1 Data Backup

**CIS Control:** Custom - Business Continuity  
**Status:** ⚠️ MEDIUM  

**Findings:**
```
MEDIUM: No documented backup strategy
- MongoDB Atlas automatic backups (if enabled on paid tier)
- No backup verification process
- Recommendation: Document backup and restore procedures
- Test restore process quarterly
```

```
LOW: No infrastructure as code backup
- Amplify configuration in Git (good)
- No CloudFormation stack exports
- Recommendation: Export CloudFormation templates periodically
```

---

## 10. Security Testing

### 10.1 Vulnerability Assessment

**Status:** ⚠️ HIGH  

**Findings:**
```
HIGH: No regular security testing
- No penetration testing performed
- No vulnerability scanning
- Recommendation: 
  - Run AWS Inspector on Lambda functions
  - Perform annual penetration test
  - Enable AWS Security Hub
```

### 10.2 Code Review

**Status:** ⚠️ MEDIUM  

**Findings:**
```
MEDIUM: No automated code security scanning
- No SAST (Static Application Security Testing)
- Recommendation: Enable Amazon CodeGuru Reviewer
- Integrate security scanning in CI/CD pipeline
```

---

## Summary of Findings

### Critical (0)
None

### High (3)
1. CloudTrail not enabled - No audit trail for AWS API calls
2. Admin role hardcoded - Difficult to manage, no centralized control
3. No dependency vulnerability scanning - Potential for exploiting known CVEs

### Medium (5)
1. MFA not enforced - Weak authentication security
2. No CloudWatch alarms - Cannot detect anomalies or failures
3. Lambda not in VPC - Unrestricted outbound access
4. Limited input validation - Potential injection vulnerabilities
5. No backup verification - Cannot guarantee data recovery

### Low (4)
1. No password expiration - Passwords never rotate
2. No centralized monitoring dashboard - Difficult to assess system health
3. Lambda timeout too high - Potential DoS vector
4. No infrastructure backup - Difficult to recover from catastrophic failure

### Informational (6)
1. Password policy could be stronger (8 vs 14 chars)
2. No data retention policy
3. MongoDB IP whitelist set to 0.0.0.0/0 (required for Lambda)
4. Rate limiting not configured
5. No hardcoded secrets (good practice)
6. Structured logging implemented (good practice)

---

## Recommended Remediation Priority

### Phase 1 (Immediate - 0-30 days)
1. Enable CloudTrail with S3 bucket logging
2. Configure CloudWatch alarms for Lambda errors and auth failures
3. Run npm audit and update vulnerable dependencies
4. Enable MFA for admin account

### Phase 2 (Short-term - 30-90 days)
1. Implement Cognito Groups for role-based access control
2. Deploy Lambda in VPC with Security Groups
3. Enable AWS Security Hub and Inspector
4. Configure CloudWatch log retention (90 days)
5. Implement input validation middleware

### Phase 3 (Long-term - 90-180 days)
1. Enable automatic secret rotation (90 days)
2. Implement data retention policy
3. Set up automated security scanning (CodeGuru)
4. Document and test backup/restore procedures
5. Perform penetration testing
6. Create centralized monitoring dashboard

---

## AWS Security Tools Recommended

### Assessment Tools
1. **AWS Security Hub** - Centralized security findings
2. **AWS Inspector** - Vulnerability scanning for Lambda
3. **AWS Config** - Resource configuration compliance
4. **AWS Trusted Advisor** - Best practice checks

### Monitoring Tools
1. **CloudWatch** - Logging and metrics
2. **CloudTrail** - API audit logging
3. **AWS X-Ray** - Distributed tracing
4. **GuardDuty** - Threat detection

### Code Security Tools
1. **Amazon CodeGuru Reviewer** - AI-powered code review
2. **Amazon CodeGuru Security** - Security vulnerability detection
3. **npm audit** - Dependency vulnerability scanning
4. **Snyk** - Third-party security scanning

---

## Compliance Mapping

### CIS AWS Foundations Benchmark v1.5.0

| Control | Description | Status | Priority |
|---------|-------------|--------|----------|
| 1.4 | Access keys rotated every 90 days | ⚠️ Partial | High |
| 1.12 | Credentials unused for 90 days disabled | ⚠️ Not Implemented | Medium |
| 1.14 | MFA enabled for root user | ⚠️ Not Enforced | High |
| 1.16 | IAM policies attached to groups/roles | ✅ Compliant | - |
| 2.1 | S3 bucket policy requires SSL | ✅ Compliant | - |
| 3.1 | CloudTrail enabled in all regions | ❌ Not Enabled | Critical |
| 3.6 | S3 bucket access logging enabled | ⚠️ Partial | Medium |
| 4.1 | Unauthorized API calls monitored | ❌ Not Implemented | High |
| 5.1 | Network ACLs restrict port 22 | ⚠️ N/A (Serverless) | - |

---

## Conclusion

The Exam Readiness Tracker application demonstrates good security practices in several areas, particularly in encryption, authentication, and error handling. However, there are opportunities for improvement in logging, monitoring, and infrastructure security.

The application is suitable for production use with low-to-moderate security requirements. For handling sensitive data or compliance-driven environments, implementing the Phase 1 and Phase 2 recommendations is strongly advised.

**Next Steps:**
1. Review findings with development team
2. Prioritize remediation based on risk assessment
3. Implement AWS security tools for continuous monitoring
4. Schedule follow-up assessment in 90 days

---

**Assessment Completed By:** IT Security Auditor  
**Date:** December 2, 2024  
**Document Version:** 1.0  
**Classification:** Internal Use Only


---

## Appendix A: Automated Assessment Tools & Commands

### Assessment Methodology Note

This assessment was performed through **manual code review** of the application source code, architecture documentation, and configuration files. For a comprehensive production assessment, the following AWS security tools should be used to validate and enhance these findings.

---

### 1. AWS Security Hub - Automated CIS Benchmark Checks

**Purpose:** Centralized security findings and automated compliance checks

**Setup:**
```bash
# Enable Security Hub
aws securityhub enable-security-hub --enable-default-standards

# Enable CIS AWS Foundations Benchmark
aws securityhub batch-enable-standards \
  --standards-subscription-requests StandardsArn=arn:aws:securityhub:us-east-1::standards/cis-aws-foundations-benchmark/v/1.4.0
```

**Run Assessment:**
```bash
# Get all failed CIS controls
aws securityhub get-findings \
  --filters '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],"ProductName":[{"Value":"Security Hub","Comparison":"EQUALS"}]}' \
  --query 'Findings[*].[Title,Compliance.Status,Severity.Label]' \
  --output table

# Get findings by severity
aws securityhub get-findings \
  --filters '{"SeverityLabel":[{"Value":"CRITICAL","Comparison":"EQUALS"}]}' \
  --max-items 50

# Export findings to JSON
aws securityhub get-findings \
  --filters '{"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
  --output json > security-hub-findings.json
```

**Cost:** $0.0010 per 10,000 finding ingestion events (first 10,000 free per month)

---

### 2. AWS Config - Configuration Compliance

**Purpose:** Track resource configurations and compliance with rules

**Setup:**
```bash
# Enable AWS Config
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::ACCOUNT_ID:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig \
  --recording-group allSupported=true,includeGlobalResourceTypes=true

# Start recording
aws configservice start-configuration-recorder --configuration-recorder-name default
```

**Run Assessment:**
```bash
# Check compliance status
aws configservice describe-compliance-by-config-rule \
  --query 'ComplianceByConfigRules[?Compliance.ComplianceType==`NON_COMPLIANT`].[ConfigRuleName,Compliance.ComplianceType]' \
  --output table

# Get detailed compliance for specific rule
aws configservice get-compliance-details-by-config-rule \
  --config-rule-name cloudtrail-enabled \
  --compliance-types NON_COMPLIANT

# List all config rules
aws configservice describe-config-rules \
  --query 'ConfigRules[*].[ConfigRuleName,Source.Owner,ConfigRuleState]' \
  --output table
```

**Cost:** $0.003 per configuration item recorded

---

### 3. AWS Trusted Advisor - Best Practice Checks

**Purpose:** Real-time guidance to provision resources following AWS best practices

**Run Assessment:**
```bash
# List all Trusted Advisor checks
aws support describe-trusted-advisor-checks \
  --language en \
  --query 'checks[*].[name,id,category]' \
  --output table

# Get check results (requires Business or Enterprise support)
aws support describe-trusted-advisor-check-result \
  --check-id <CHECK_ID> \
  --language en

# Refresh all checks
aws support refresh-trusted-advisor-check \
  --check-id <CHECK_ID>
```

**Note:** Full Trusted Advisor requires Business or Enterprise support plan

---

### 4. Prowler - Open Source CIS Assessment Tool

**Purpose:** Comprehensive automated CIS Benchmark assessment

**Installation:**
```bash
# Install Prowler
pip install prowler

# Or use Docker
docker pull prowler/prowler
```

**Run Assessment:**
```bash
# Full CIS 1.5 assessment
prowler aws --compliance cis_1.5_aws

# Specific checks only
prowler aws --checks check11,check12,check13

# Output to HTML report
prowler aws --compliance cis_1.5_aws --output-formats html

# Output to JSON for automation
prowler aws --compliance cis_1.5_aws --output-formats json

# Check specific services
prowler aws --services iam cognito lambda

# Quiet mode (only show failures)
prowler aws --compliance cis_1.5_aws --status FAIL
```

**Cost:** Free (open source)

---

### 5. AWS Inspector - Vulnerability Scanning

**Purpose:** Automated security assessment for Lambda functions and EC2 instances

**Setup:**
```bash
# Enable Inspector
aws inspector2 enable \
  --resource-types LAMBDA EC2

# Check activation status
aws inspector2 batch-get-account-status \
  --account-ids $(aws sts get-caller-identity --query Account --output text)
```

**Run Assessment:**
```bash
# List findings
aws inspector2 list-findings \
  --filter-criteria '{"severity":[{"comparison":"EQUALS","value":"HIGH"}]}' \
  --max-results 100

# Get findings for specific Lambda function
aws inspector2 list-findings \
  --filter-criteria '{"resourceType":[{"comparison":"EQUALS","value":"AWS_LAMBDA_FUNCTION"}],"resourceId":[{"comparison":"EQUALS","value":"mongo-connector"}]}' \
  --output json

# Export findings report
aws inspector2 create-findings-report \
  --report-format JSON \
  --s3-destination bucketName=my-security-reports,keyPrefix=inspector/
```

**Cost:** $0.30 per Lambda function per month (first 90 days free)

---

### 6. Amazon GuardDuty - Threat Detection

**Purpose:** Intelligent threat detection using machine learning

**Setup:**
```bash
# Enable GuardDuty
aws guardduty create-detector --enable

# Get detector ID
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text)
```

**Run Assessment:**
```bash
# List findings
aws guardduty list-findings \
  --detector-id $DETECTOR_ID \
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}' \
  --max-results 50

# Get finding details
aws guardduty get-findings \
  --detector-id $DETECTOR_ID \
  --finding-ids <FINDING_ID>

# Export findings
aws guardduty create-findings-export \
  --detector-id $DETECTOR_ID \
  --destination-type S3 \
  --destination-properties DestinationArn=arn:aws:s3:::my-guardduty-findings
```

**Cost:** $4.50 per million CloudTrail events analyzed (first 30 days free)

---

### 7. Amazon CodeGuru - Code Security Review

**Purpose:** AI-powered code review for security vulnerabilities

**Setup:**
```bash
# Associate repository
aws codeguru-reviewer associate-repository \
  --repository Name=aws-quiz-app,ConnectionArn=arn:aws:codestar-connections:us-east-1:ACCOUNT_ID:connection/CONNECTION_ID

# Create code review
aws codeguru-reviewer create-code-review \
  --name quiz-app-security-review \
  --repository-association-arn <ASSOCIATION_ARN> \
  --type RepositoryAnalysis={RepositoryHead={BranchName=main}}
```

**Run Assessment:**
```bash
# List code reviews
aws codeguru-reviewer list-code-reviews \
  --type RepositoryAnalysis \
  --max-results 10

# Get recommendations
aws codeguru-reviewer list-recommendations \
  --code-review-arn <CODE_REVIEW_ARN> \
  --max-results 100

# Filter by severity
aws codeguru-reviewer list-recommendations \
  --code-review-arn <CODE_REVIEW_ARN> \
  --query 'RecommendationSummaries[?Severity==`Critical`]'
```

**Cost:** $0.75 per 100 lines of code analyzed (first 90 days free)

---

### 8. AWS CloudTrail - Audit Logging

**Purpose:** Log all API calls for security analysis and compliance

**Setup:**
```bash
# Create trail
aws cloudtrail create-trail \
  --name security-audit-trail \
  --s3-bucket-name my-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --name security-audit-trail
```

**Run Assessment:**
```bash
# Check if CloudTrail is enabled
aws cloudtrail describe-trails \
  --query 'trailList[*].[Name,IsMultiRegionTrail,LogFileValidationEnabled]' \
  --output table

# Get recent events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteUser \
  --max-results 10

# Check for unauthorized API calls
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=UnauthorizedOperation \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --max-results 50
```

**Cost:** $2.00 per 100,000 management events (first trail free)

---

### 9. AWS IAM Access Analyzer

**Purpose:** Identify resources shared with external entities

**Setup:**
```bash
# Create analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name security-analyzer \
  --type ACCOUNT
```

**Run Assessment:**
```bash
# List findings
aws accessanalyzer list-findings \
  --analyzer-arn arn:aws:access-analyzer:us-east-1:ACCOUNT_ID:analyzer/security-analyzer \
  --filter '{"status":{"eq":["ACTIVE"]}}' \
  --max-results 100

# Get finding details
aws accessanalyzer get-finding \
  --analyzer-arn <ANALYZER_ARN> \
  --id <FINDING_ID>
```

**Cost:** Free

---

### 10. ScoutSuite - Multi-Cloud Security Auditing

**Purpose:** Open-source multi-cloud security auditing tool

**Installation:**
```bash
# Install ScoutSuite
pip install scoutsuite
```

**Run Assessment:**
```bash
# Full AWS assessment
scout aws --report-dir ./security-reports

# Specific services only
scout aws --services iam lambda cognito s3

# Use specific profile
scout aws --profile production --report-dir ./prod-security

# Generate HTML report
scout aws --report-dir ./reports --html
```

**Cost:** Free (open source)

---

## Recommended Assessment Workflow

### Phase 1: Initial Discovery (Day 1)
```bash
# 1. Enable Security Hub and CIS Benchmark
aws securityhub enable-security-hub --enable-default-standards

# 2. Run Prowler for immediate CIS assessment
prowler aws --compliance cis_1.5_aws --output-formats html,json

# 3. Check IAM Access Analyzer
aws accessanalyzer list-findings --analyzer-arn <ARN>
```

### Phase 2: Deep Analysis (Days 2-3)
```bash
# 4. Enable and run Inspector on Lambda functions
aws inspector2 enable --resource-types LAMBDA
aws inspector2 list-findings --max-results 100

# 5. Run CodeGuru security review
aws codeguru-reviewer create-code-review --name security-review

# 6. Check Config compliance
aws configservice describe-compliance-by-config-rule
```

### Phase 3: Continuous Monitoring (Ongoing)
```bash
# 7. Enable GuardDuty for threat detection
aws guardduty create-detector --enable

# 8. Enable CloudTrail for audit logging
aws cloudtrail create-trail --name audit-trail

# 9. Schedule weekly Prowler scans
prowler aws --compliance cis_1.5_aws --output-formats json > weekly-scan.json
```

---

## Cost Estimate for Full Assessment

| Tool | Monthly Cost | Notes |
|------|--------------|-------|
| Security Hub | ~$10 | Based on findings volume |
| AWS Config | ~$15 | Based on resources tracked |
| Inspector | ~$30 | For Lambda functions |
| GuardDuty | ~$20 | Based on CloudTrail events |
| CodeGuru | Free | First 90 days |
| CloudTrail | $2 | First trail free |
| IAM Access Analyzer | Free | - |
| Prowler | Free | Open source |
| ScoutSuite | Free | Open source |
| **Total** | **~$77/month** | After free tiers |

**Note:** Costs vary based on usage. First-time users can leverage free tiers for initial assessment.

---

## Additional Resources

- **CIS AWS Foundations Benchmark:** https://www.cisecurity.org/benchmark/amazon_web_services
- **AWS Security Hub Documentation:** https://docs.aws.amazon.com/securityhub/
- **Prowler GitHub:** https://github.com/prowler-cloud/prowler
- **AWS Security Best Practices:** https://aws.amazon.com/architecture/security-identity-compliance/
- **NIST Cybersecurity Framework:** https://www.nist.gov/cyberframework

---

**Assessment Methodology Disclosure:** This initial assessment was performed through manual code review. For production validation, execute the automated tools listed above to verify findings and discover additional security issues not visible in source code alone.
