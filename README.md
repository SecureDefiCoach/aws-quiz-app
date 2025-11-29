# ERT - Exam Readiness Tracker

A full-stack quiz application for AWS certification exam preparation with adaptive learning and progress tracking.

## Features

- **Multi-Exam Support**: Support for various AWS certifications (SCS-C02, etc.)
- **Adaptive Learning**: Smart question selection that avoids mastered content
- **Progress Tracking**: Track your performance with New/Wrong/Right/Mastered states
- **Question Marking**: Flag questions for review with different mark types
- **Session Management**: 24-hour quiz sessions with automatic cleanup
- **User Authentication**: Secure authentication via AWS Cognito
- **Subdomain Filtering**: Focus on specific exam domains

## Architecture

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cloud**: AWS Amplify Gen 2
  - Lambda functions for GraphQL resolvers
  - AppSync for GraphQL API
  - Cognito for authentication
- **Logging**: Winston with structured JSON logging

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Library**: AWS Amplify UI React
- **Hosting**: AWS Amplify Console

## Project Structure

```
/
├── front-end/                    # React frontend application
│   ├── amplify/                  # AWS Amplify backend configuration
│   │   ├── auth/                 # Cognito authentication
│   │   ├── data/                 # GraphQL schema
│   │   └── functions/            # Lambda functions
│   │       └── mongo-connector/  # Quiz service Lambda
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── QuizBuilder.tsx   # Quiz configuration UI
│   │   │   └── QuizCard.tsx      # Question display and answering
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   └── amplify_outputs.json      # Backend configuration
├── models/                       # MongoDB schemas (legacy)
├── scripts/                      # Database utilities
│   └── import-questions.js       # CSV import script
├── data/                         # Question bank CSV files
└── server.js                     # Legacy Express server

```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- AWS Account
- Git

### 1. Clone Repository

```bash
git clone https://github.com/SecureDefiCoach/aws-quiz-app.git
cd aws-quiz-app
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd front-end
npm install
```

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```env
MONGO_URI=mongodb://localhost:27017/aws-quiz-db
PORT=3000
NODE_ENV=development
```

### 4. Import Questions

```bash
npm run db:seed
```

### 5. Deploy Backend

```bash
cd front-end
npx ampx sandbox
```

This will deploy:
- Lambda functions
- GraphQL API
- Cognito user pool
- Generate `amplify_outputs.json`

### 6. Run Frontend Locally

```bash
cd front-end
npm run dev
```

Access the app at `http://localhost:5173`

### 7. Deploy to Production

Push to GitHub main branch - Amplify Console will automatically build and deploy.

## API Documentation

### GraphQL Queries

#### getExams
Returns all available exams.

```graphql
query GetExams {
  getExams {
    number
    name
    display
  }
}
```

#### getSubDomains
Returns subdomains for a specific exam.

```graphql
query GetSubDomains($examNumber: String!) {
  getSubDomains(examNumber: $examNumber) {
    num
    name
  }
}
```

#### getQuestionCount
Returns count of questions matching filters.

```graphql
query GetQuestionCount(
  $examNumber: String!
  $subDomain: String
  $states: [String!]!
) {
  getQuestionCount(
    examNumber: $examNumber
    subDomain: $subDomain
    states: $states
  )
}
```

#### startQuiz
Creates a new quiz session.

```graphql
query StartQuiz(
  $examNumber: String!
  $examName: String!
  $subDomain: String
  $states: [String!]!
  $maxQuestions: Int
) {
  startQuiz(
    examNumber: $examNumber
    examName: $examName
    subDomain: $subDomain
    states: $states
    maxQuestions: $maxQuestions
  ) {
    sessionId
    total
    examNumber
    examName
    subDomain
  }
}
```

#### getCurrentQuestion
Gets the current question in a quiz session.

```graphql
query GetCurrentQuestion($sessionId: String!) {
  getCurrentQuestion(sessionId: $sessionId) {
    questionNumber
    total
    question
    options {
      letter
      text
    }
    isMulti
    questionType
    subDomain
    countRight
    countWrong
    sessionCorrect
    sessionWrong
    markType
  }
}
```

### GraphQL Mutations

#### submitAnswer
Submits an answer for the current question.

```graphql
mutation SubmitAnswer(
  $sessionId: String!
  $questionId: String!
  $selectedLetters: [String!]!
) {
  submitAnswer(
    sessionId: $sessionId
    questionId: $questionId
    selectedLetters: $selectedLetters
  ) {
    isCorrect
    correctLetters
    selectedLetters
    explanation
    countRight
    countWrong
    isComplete
    summary {
      correct
      total
      percentage
    }
  }
}
```

#### markAsMastered
Marks a question as mastered.

```graphql
mutation MarkAsMastered($questionId: String!) {
  markAsMastered(questionId: $questionId)
}
```

#### setQuestionMark
Sets a mark type on a question.

```graphql
mutation SetQuestionMark($questionId: String!, $markType: Int!) {
  setQuestionMark(questionId: $questionId, markType: $markType)
}
```

## Environment Variables

### Backend (Lambda)

Set in AWS Amplify Console or via `amplify/functions/mongo-connector/resource.ts`:

- `MONGO_URI` - MongoDB connection string (stored in Secrets Manager)
- `DB_NAME` - Database name (default: `aws-quiz-db`)
- `LOG_LEVEL` - Logging level: `DEBUG`, `INFO`, `WARN`, `ERROR`
- `NODE_ENV` - Environment: `development`, `production`

### Frontend

Configured automatically via `amplify_outputs.json` generated during backend deployment.

## Database Schema

### Questions Collection
```javascript
{
  examNumber: String,
  examName: String,
  originalNumber: String,
  question: String,
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String,
  optionE: String,
  optionF: String,
  answer: String,
  explanation: String,
  questionType: Number,
  subDomain: String,
  domainNum: Number,
  domainName: String
}
```

### UserProgress Collection
```javascript
{
  userId: String,
  questionId: ObjectId,
  examNumber: String,
  originalNumber: String,
  state: String, // 'NEW', 'RIGHT', 'WRONG', 'MASTERED'
  countRight: Number,
  countWrong: Number,
  lastAttempt: Date,
  uniqueIndex: String, // userId:questionId
  markType: Number // 0=none, 1=flag, 2=star, etc.
}
```

### QuizSessions Collection
```javascript
{
  sessionId: String,
  userId: String,
  examNumber: String,
  examName: String,
  subDomain: String,
  questions: [ObjectId],
  currentIndex: Number,
  correctCount: Number,
  wrongCount: Number,
  createdAt: Date,
  expiresAt: Date // TTL index - auto-delete after 24 hours
}
```

## Troubleshooting

### Build Fails on Amplify

**Issue**: `Could not resolve "../amplify_outputs.json"`

**Solution**: Ensure `amplify_outputs.json` is committed to git and not in `.gitignore`

### Backend Not Deploying

**Issue**: "No backend environment association found"

**Solution**: Run `npx ampx sandbox` locally to deploy backend resources

### MongoDB Connection Errors

**Issue**: Lambda can't connect to MongoDB

**Solution**: 
1. Check `MONGO_URI` is set in Secrets Manager
2. Verify MongoDB allows connections from AWS Lambda IPs
3. Check CloudWatch logs for detailed error messages

### Authentication Issues

**Issue**: User can't sign in

**Solution**:
1. Verify email is confirmed in Cognito
2. Check password meets requirements (8+ chars, complexity)
3. Clear browser cache and try again

## Monitoring

### CloudWatch Logs

Lambda logs are in CloudWatch under `/aws/lambda/mongo-connector`

Structured JSON format:
```json
{
  "level": "INFO",
  "message": "ENTRY: startQuiz",
  "requestId": "abc-123",
  "timestamp": "2025-11-29T12:00:00Z",
  "context": {
    "examNumber": "SCS-C02",
    "userId": "user-123"
  }
}
```

### Metrics to Monitor

- Lambda invocation count
- Lambda error rate
- Lambda duration (p50, p95, p99)
- Cognito sign-in success/failure
- MongoDB connection pool size

## Development

### Running Tests

```bash
# Backend tests
npm test

# Frontend tests
cd front-end
npm test
```

### Local Development

```bash
# Start backend server (legacy)
npm run dev

# Start frontend with hot reload
cd front-end
npm run dev
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Add JSDoc comments to all functions
- Use structured logging with context

## Contributing

1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.
