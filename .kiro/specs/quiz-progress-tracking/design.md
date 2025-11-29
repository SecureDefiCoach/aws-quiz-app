# Design Document - AWS Multi-Exam Quiz Application

## Overview

This document describes the technical design for migrating the AWS Multi-Exam Quiz application from Google Apps Script/Sheets to a serverless AWS architecture. The system uses AppSync (GraphQL) → Lambda (Node.js/TypeScript) → MongoDB Atlas to provide adaptive learning through state-based progress tracking across multiple AWS certification exams.

**Phase 1 Focus:** Core quiz functionality including multi-exam support, state-based filtering, quiz sessions, progress tracking, authentication, and data persistence.

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
│  (React/TS) │
└──────┬──────┘
       │ HTTPS/TLS
       ▼
┌─────────────────┐
│  AWS Amplify    │
│  - Hosting      │
│  - Auth (Cognito)│
└──────┬──────────┘
       │ GraphQL/HTTPS
       ▼
┌─────────────────┐
│  AWS AppSync    │
│  (GraphQL API)  │
└──────┬──────────┘
       │ Invoke
       ▼
┌─────────────────┐
│  AWS Lambda     │
│  (Node.js/TS)   │
└──────┬──────────┘
       │ TLS/SSL
       ▼
┌─────────────────┐
│ MongoDB Atlas   │
│ (Free Tier)     │
└─────────────────┘
```

### Security Architecture

**Encryption in Transit:**
- Browser ↔ Amplify: HTTPS/TLS 1.3
- Amplify ↔ AppSync: HTTPS with AWS Signature V4
- AppSync ↔ Lambda: AWS internal encrypted channels
- Lambda ↔ MongoDB: TLS/SSL 1.2+

**Encryption at Rest:**
- MongoDB Atlas: AES-256 encryption enabled by default
- AWS Secrets Manager: Encrypted storage for MONGO_URI
- Cognito: Encrypted user credentials

**Authentication Flow:**
```
User → Cognito (email/password) → JWT Token → AppSync (validates) → Lambda (userId from token)
```

## Components and Interfaces

### 1. Frontend (React + TypeScript + Amplify)

**Technology Stack:**
- React 18+ with TypeScript
- AWS Amplify Libraries (Auth, API)
- Amplify UI Components for authentication
- GraphQL Code Generator for type-safe queries

**Key Components:**
- `QuizBuilder`: Exam/subdomain selection, state filters, max questions
- `QuizCard`: Question display, option selection, answer submission
- `ProgressTracker`: Real-time session statistics
- `AuthWrapper`: Login/signup forms using Amplify UI

### 2. AWS AppSync (GraphQL API)

**Schema Definition:**

```graphql
type Query {
  # Get available exams
  getExams: [Exam!]! @aws_cognito_user_pools
  
  # Get subdomains for an exam
  getSubDomains(examNumber: String!): [SubDomain!]! @aws_cognito_user_pools
  
  # Count questions matching filters
  getQuestionCount(filters: QuestionFilters!): Int! @aws_cognito_user_pools
  
  # Start a new quiz session
  startQuiz(filters: QuizFilters!): QuizSession @aws_cognito_user_pools
  
  # Get current question in session
  getCurrentQuestion(sessionId: ID!): QuestionData @aws_cognito_user_pools
}

type Mutation {
  # Submit answer and update progress
  submitAnswer(input: AnswerSubmission!): AnswerFeedback! @aws_cognito_user_pools
  
  # Mark question as mastered
  markAsMastered(questionId: ID!): Boolean! @aws_cognito_user_pools
}

type Exam {
  number: String!
  name: String!
  display: String!
}

type SubDomain {
  num: Float!
  name: String!
}

input QuestionFilters {
  examNumber: String!
  subDomain: String
  states: [QuestionState!]!
}

input QuizFilters {
  examNumber: String!
  examName: String!
  subDomain: String
  states: [QuestionState!]!
  maxQuestions: Int
}

enum QuestionState {
  NEW
  WRONG
  RIGHT
}

type QuizSession {
  sessionId: ID!
  total: Int!
  examNumber: String!
  examName: String!
  subDomain: String!
}

type QuestionData {
  questionNumber: Int!
  total: Int!
  question: String!
  options: [Option!]!
  isMulti: Boolean!
  questionType: Int!
  rowNum: Int!
  subDomain: String!
  countRight: Int!
  countWrong: Int!
  sessionCorrect: Int!
  sessionWrong: Int!
  originalNumber: String
}

type Option {
  letter: String!
  text: String!
}

input AnswerSubmission {
  sessionId: ID!
  questionId: ID!
  selectedLetters: [String!]!
}

type AnswerFeedback {
  isCorrect: Boolean!
  correctLetters: [String!]!
  selectedLetters: [String!]!
  explanation: String
  countRight: Int!
  countWrong: Int!
  isComplete: Boolean!
  summary: QuizSummary
}

type QuizSummary {
  correct: Int!
  total: Int!
  percentage: Int!
}
```

**Authorization:**
- All operations require Cognito authentication
- User ID extracted from JWT token context
- Row-level security enforced in Lambda

### 3. AWS Lambda Functions

**Function: quiz-resolver**

**Purpose:** Handles all quiz-related GraphQL operations

**Runtime:** Node.js 20.x with TypeScript

**Environment Variables:**
- `MONGO_URI`: Connection string (from Secrets Manager)
- `DB_NAME`: Database name (aws-quiz-db)
- `LOG_LEVEL`: Logging level (INFO/WARN/ERROR)
- `NODE_ENV`: Environment (development/production)

**Memory:** 512 MB  
**Timeout:** 30 seconds  
**Concurrency:** 10 (free tier limit)

**Handler Structure:**

```typescript
// src/handlers/quiz-resolver.ts
export const handler = async (event: AppSyncEvent): Promise<any> => {
  const logger = createLogger(event.requestId);
  logger.logEntry('quiz-resolver', { fieldName: event.info.fieldName });
  
  try {
    const userId = event.identity.sub; // From Cognito JWT
    const fieldName = event.info.fieldName;
    const args = event.arguments;
    
    // Route to appropriate handler
    switch (fieldName) {
      case 'getExams':
        return await getExams(logger);
      case 'getSubDomains':
        return await getSubDomains(args.examNumber, logger);
      case 'startQuiz':
        return await startQuiz(userId, args.filters, logger);
      case 'getCurrentQuestion':
        return await getCurrentQuestion(userId, args.sessionId, logger);
      case 'submitAnswer':
        return await submitAnswer(userId, args.input, logger);
      case 'markAsMastered':
        return await markAsMastered(userId, args.questionId, logger);
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    logger.logError('quiz-resolver', error);
    throw error;
  } finally {
    logger.logExit('quiz-resolver');
  }
};
```

**Logging Module:**

```typescript
// src/utils/logger.ts
export interface Logger {
  logEntry(functionName: string, data?: any): void;
  logExit(functionName: string, data?: any): void;
  logError(functionName: string, error: Error, data?: any): void;
  logInfo(message: string, data?: any): void;
}

export function createLogger(requestId: string): Logger {
  const startTime = Date.now();
  
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
    
    logExit(functionName, data) {
      console.log(JSON.stringify({
        level: 'INFO',
        event: 'EXIT',
        requestId,
        functionName,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        data
      }));
    },
    
    logError(functionName, error, data) {
      console.error(JSON.stringify({
        level: 'ERROR',
        event: 'ERROR',
        requestId,
        functionName,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString(),
        data
      }));
    },
    
    logInfo(message, data) {
      console.log(JSON.stringify({
        level: 'INFO',
        requestId,
        message,
        timestamp: new Date().toISOString(),
        data
      }));
    }
  };
}
```

### 4. MongoDB Atlas (Free Tier)

**Database:** `aws-quiz-db`

**Collections:**

**questions:**
```typescript
{
  _id: ObjectId,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  optionE?: string,
  optionF?: string,
  answer: string,              // "A" or "A,B" for multi-answer
  explanation?: string,
  examNumber: string,          // "SCS-C02"
  examName: string,            // "AWS Certified Security - Specialty"
  domainNum?: string,          // "1" (optional - for future exams)
  domainName?: string,         // "Access Controls" (optional - for future exams)
  subDomainNum: string,        // "1.2"
  subDomain: string,           // "Detection & Investigation"
  originalNumber?: string,
  createdDate: Date
}
```

**userProgress:**
```typescript
{
  _id: ObjectId,
  userId: string,              // Cognito user ID
  questionId: ObjectId,        // Reference to questions._id
  uniqueIndex: string,         // "${userId}-${questionId}"
  state: string,               // "NEW" | "WRONG" | "RIGHT" | "MASTERED"
  attemptCount: number,
  rightCount: number,
  wrongCount: number,
  lastUpdateDate: Date,
  createdDate: Date
}
```

**Indexes:**
- `questions`: `{ examNumber: 1, subDomain: 1 }`
- `questions`: `{ examNumber: 1, subDomainNum: 1 }`
- `userProgress`: `{ uniqueIndex: 1 }` (unique)
- `userProgress`: `{ userId: 1, state: 1 }`
- `userProgress`: `{ userId: 1, questionId: 1 }`

**quizSessions:**
```typescript
{
  _id: ObjectId,
  sessionId: string,           // "quiz_${timestamp}"
  userId: string,
  questions: Array<{
    questionId: ObjectId,
    rowNum: number,            // For compatibility
    examNumber: string,
    examName: string,
    subDomain: string,
    question: string,
    options: Array<{ letter: string, text: string }>,
    answer: string,
    explanation: string,
    isMulti: boolean,
    questionType: number,
    countRight: number,
    countWrong: number,
    originalNumber: string
  }>,
  currentIndex: number,
  correctCount: number,
  wrongCount: number,
  filters: object,
  createdAt: Date,
  expiresAt: Date              // TTL index for auto-cleanup
}
```

**Indexes:**
- `quizSessions`: `{ sessionId: 1, userId: 1 }` (unique)
- `quizSessions`: `{ expiresAt: 1 }` (TTL index, 24 hours)

## Data Models

### Question Model

```typescript
// src/models/Question.ts
export interface Question {
  _id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  optionF?: string;
  answer: string;
  explanation?: string;
  examNumber: string;
  examName: string;
  domainNum?: string;        // Optional: "1" for domain-level grouping
  domainName?: string;       // Optional: "Access Controls"
  subDomainNum: string;
  subDomain: string;
  originalNumber?: string;
  createdDate: Date;
}

export interface QuestionWithProgress extends Question {
  state: QuestionState;
  attemptCount: number;
  rightCount: number;
  wrongCount: number;
}

export enum QuestionState {
  NEW = 'NEW',
  WRONG = 'WRONG',
  RIGHT = 'RIGHT',
  MASTERED = 'MASTERED'
}
```

### User Progress Model

```typescript
// src/models/UserProgress.ts
export interface UserProgress {
  _id: string;
  userId: string;
  questionId: string;
  uniqueIndex: string;
  state: QuestionState;
  attemptCount: number;
  rightCount: number;
  wrongCount: number;
  lastUpdateDate: Date;
  createdDate: Date;
}
```

### Quiz Session Model

```typescript
// src/models/QuizSession.ts
export interface QuizSession {
  _id: string;
  sessionId: string;
  userId: string;
  questions: SessionQuestion[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  filters: QuizFilters;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionQuestion {
  questionId: string;
  rowNum: number;
  examNumber: string;
  examName: string;
  subDomain: string;
  question: string;
  options: QuestionOption[];
  answer: string;
  explanation: string;
  isMulti: boolean;
  questionType: number;
  countRight: number;
  countWrong: number;
  originalNumber: string;
}

export interface QuestionOption {
  letter: string;
  text: string;
}
```

## Error Handling

### Error Types

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, 500, details);
    this.name = 'DatabaseError';
  }
}
```

### Error Handler

```typescript
// src/utils/errorHandler.ts
export function handleError(error: Error, logger: Logger): never {
  if (error instanceof AppError) {
    logger.logError('AppError', error, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    });
    
    throw new Error(JSON.stringify({
      errorType: error.code,
      errorMessage: error.message,
      statusCode: error.statusCode
    }));
  }
  
  // Unknown error
  logger.logError('UnknownError', error);
  throw new Error(JSON.stringify({
    errorType: 'INTERNAL_ERROR',
    errorMessage: 'An unexpected error occurred',
    statusCode: 500
  }));
}
```

## Testing Strategy

### Unit Testing

**Framework:** Jest with TypeScript

**Coverage Target:** 80% for business logic

**Test Structure:**
```typescript
// tests/unit/services/quizService.test.ts
describe('QuizService', () => {
  describe('startQuiz', () => {
    it('should return questions matching exam filter', async () => {
      // Arrange
      const mockDb = createMockDb();
      const filters = { examNumber: 'SCS-C02', states: ['NEW'] };
      
      // Act
      const result = await startQuiz('user123', filters, mockLogger);
      
      // Assert
      expect(result.questions).toHaveLength(10);
      expect(result.questions[0].examNumber).toBe('SCS-C02');
    });
    
    it('should exclude mastered questions', async () => {
      // Test implementation
    });
    
    it('should shuffle questions randomly', async () => {
      // Test implementation
    });
  });
});
```

**Key Test Cases:**
- Question filtering by exam and subdomain
- State-based filtering (NEW/WRONG/RIGHT, excluding MASTERED)
- Randomization with Fisher-Yates shuffle
- Progress state transitions
- Answer validation (single and multi-answer)
- Session expiration and cleanup

### Integration Testing

**Framework:** Jest with MongoDB Memory Server

**Test Scenarios:**
- End-to-end quiz flow (start → answer → complete)
- User progress persistence across sessions
- Concurrent user sessions
- Session cleanup after 24 hours
- Authentication token validation

### Manual Testing Checklist

**Phase 1 MVP:**
- [ ] User can sign up with email/password
- [ ] User can log in and receive JWT token
- [ ] User can select an exam from dropdown
- [ ] User can select a subdomain (or "All")
- [ ] User can select state filters (New/Wrong/Right)
- [ ] User can set max questions limit
- [ ] User can start a quiz session
- [ ] Questions are randomized each session
- [ ] User can select answer options
- [ ] User can submit answer
- [ ] System shows correct/incorrect feedback
- [ ] System updates progress state
- [ ] System increments attempt counts
- [ ] User can mark question as mastered
- [ ] Session completes with summary
- [ ] Multiple users have isolated progress

## Deployment Strategy

### Phase 1 Deployment

**Infrastructure as Code:** AWS Amplify CLI

**Deployment Steps:**

1. **Initialize Amplify Project**
```bash
cd front-end
npx ampx sandbox  # Development
npx ampx pipeline-deploy --branch main  # Production
```

2. **Configure Authentication**
```bash
# Amplify Auth already configured in amplify/auth/resource.ts
# Email/password with email verification
```

3. **Deploy AppSync API**
```bash
# Schema defined in amplify/data/resource.ts
# Lambda resolver configured in amplify/functions/quiz-resolver.ts
```

4. **Set MongoDB Secret**
```bash
npx ampx sandbox secret set MONGO_URI
# Enter: mongodb+srv://user:pass@cluster.mongodb.net/
```

5. **Deploy Lambda Function**
```bash
# Automatically deployed with Amplify
# Timeout: 30s, Memory: 512MB
```

### Environment Configuration

**Development (Sandbox):**
- Auto-deploys on file changes
- Separate Cognito user pool
- Separate AppSync API
- Uses same MongoDB (different database)

**Production:**
- Manual deployment via pipeline
- Production Cognito user pool
- Production AppSync API
- Production MongoDB database

### Monitoring

**CloudWatch Dashboards:**
- Lambda invocation count and errors
- Lambda duration (p50, p95, p99)
- AppSync request count and latency
- Cognito sign-up and sign-in metrics

**CloudWatch Alarms:**
- Lambda error rate > 5%
- Lambda duration > 25 seconds
- AppSync 5xx errors > 1%

**Log Insights Queries:**

```sql
-- Find all errors in last hour
fields @timestamp, functionName, error.message, error.stack
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

-- Track quiz session performance
fields @timestamp, functionName, duration
| filter event = "EXIT" and functionName = "startQuiz"
| stats avg(duration), max(duration), count() by bin(5m)

-- Monitor user activity
fields @timestamp, userId, fieldName
| filter event = "ENTRY"
| stats count() by userId, fieldName
```

## Version Control and Documentation

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat(quiz): add multi-exam filtering support

- Add getExams query to retrieve available exams
- Filter questions by examNumber in startQuiz
- Update QuizBuilder UI with exam dropdown

Closes #123
```

### Code Documentation

**File Header:**
```typescript
/**
 * @file quizService.ts
 * @description Core business logic for quiz session management
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-11-28
 */
```

**Function Documentation:**
```typescript
/**
 * Starts a new quiz session with filtered questions
 * 
 * @param userId - Cognito user ID from JWT token
 * @param filters - Quiz filters (exam, subdomain, states, maxQuestions)
 * @param logger - Logger instance for structured logging
 * @returns Quiz session with sessionId and question count
 * @throws {ValidationError} If filters are invalid
 * @throws {NotFoundError} If no questions match filters
 * @throws {DatabaseError} If database operation fails
 * 
 * @example
 * const session = await startQuiz('user123', {
 *   examNumber: 'SCS-C02',
 *   states: ['NEW', 'WRONG'],
 *   maxQuestions: 10
 * }, logger);
 */
export async function startQuiz(
  userId: string,
  filters: QuizFilters,
  logger: Logger
): Promise<QuizSession> {
  // Implementation
}
```

### API Documentation

**GraphQL Schema Documentation:**
- All types, queries, and mutations documented with descriptions
- Input validation rules documented
- Error responses documented
- Example queries provided

**README.md Structure:**
```markdown
# AWS Multi-Exam Quiz Application

## Overview
[Description]

## Architecture
[Diagram and explanation]

## Getting Started
### Prerequisites
### Installation
### Configuration
### Running Locally

## Deployment
### Development
### Production

## API Documentation
### Authentication
### Queries
### Mutations

## Development
### Project Structure
### Adding Features
### Testing
### Debugging

## Security
### Authentication
### Encryption
### Secrets Management

## Monitoring
### CloudWatch Logs
### Metrics
### Alarms

## Troubleshooting
[Common issues and solutions]

## Contributing
[Guidelines]

## License
```

## Security Considerations

### Authentication & Authorization

**Cognito Configuration:**
- Password policy: Min 8 chars, uppercase, lowercase, number, special char
- MFA: Optional (can enable later)
- Email verification: Required
- Token expiration: 1 hour (access token), 30 days (refresh token)

**AppSync Authorization:**
- All operations require valid Cognito JWT token
- User ID extracted from token claims
- No API key or public access

### Data Protection

**Sensitive Data Handling:**
- Never log passwords or tokens
- Redact email addresses in logs (show first 3 chars + ***)
- MongoDB connection string stored in Secrets Manager
- No hardcoded credentials in code

**Input Validation:**
- Validate all user inputs in Lambda
- Sanitize strings to prevent injection
- Limit array sizes to prevent DoS
- Validate enum values against allowed list

### Network Security

**VPC Configuration (Optional for Phase 2):**
- Lambda in private subnet
- NAT Gateway for MongoDB access
- Security groups restrict outbound to MongoDB only

**MongoDB Atlas:**
- IP whitelist: 0.0.0.0/0 (Lambda uses dynamic IPs)
- Database user with minimal permissions (readWrite on aws-quiz-db only)
- Connection string with TLS/SSL enforced

## Performance Optimization

### Caching Strategy

**AppSync Caching (Phase 2):**
- Cache `getExams` for 1 hour (rarely changes)
- Cache `getSubDomains` for 1 hour per exam
- No caching for user-specific data

**MongoDB Indexes:**
- Compound index on `{ examNumber, subDomain }` for fast filtering
- Index on `{ userId, state }` for progress queries
- TTL index on `quizSessions.expiresAt` for auto-cleanup

### Lambda Optimization

**Cold Start Reduction:**
- Keep handler code minimal
- Lazy-load MongoDB connection
- Use provisioned concurrency for production (if needed)

**Memory Configuration:**
- 512 MB provides good balance of cost and performance
- Monitor actual usage and adjust if needed

### Database Optimization

**Connection Pooling:**
```typescript
// Reuse MongoDB connection across Lambda invocations
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  cachedDb = client.db(process.env.DB_NAME);
  return cachedDb;
}
```

**Query Optimization:**
- Use projection to fetch only needed fields
- Limit result sets appropriately
- Use aggregation pipeline for complex queries

## Cost Estimation

### AWS Costs (2 users, light usage)

**Amplify Hosting:**
- Build minutes: 0 (free tier: 1000 min/month)
- Storage: ~100 MB = $0.01/month
- Data transfer: ~1 GB = $0.15/month

**Cognito:**
- MAU: 2 users = $0 (free tier: 50,000 MAU)

**AppSync:**
- Queries: ~5,000/month = $0 (free tier: 250,000)

**Lambda:**
- Invocations: ~5,000/month = $0 (free tier: 1M)
- Duration: ~10,000 GB-seconds = $0 (free tier: 400,000)

**CloudWatch:**
- Logs: ~500 MB = $0.25/month
- Metrics: Custom metrics = $0 (using default metrics)

**MongoDB Atlas:**
- Free tier: 512 MB storage = $0

**Total Estimated Cost: $0.50 - $2.00/month**

### Scaling Costs (100 users)

- Amplify: ~$5/month
- Cognito: $0 (still in free tier)
- AppSync: $0 (still in free tier)
- Lambda: ~$2/month
- CloudWatch: ~$3/month
- MongoDB: $0 (free tier sufficient)

**Total: ~$10/month for 100 users**

---

**Next Steps:**
1. Review and approve design document
2. Create implementation task list
3. Begin Phase 1 development
