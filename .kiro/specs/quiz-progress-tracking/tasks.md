# Implementation Plan - Phase 1: Core Quiz Functionality

## Phase 1 Overview
Build the MVP with core quiz functionality: multi-exam support, state-based filtering, quiz sessions, progress tracking, authentication, and data persistence.

---

## 1. Update MongoDB Schema and Models

- [X] 1.1 Update Question model with optional domain fields
  - Add `domainNum` and `domainName` optional fields to Question schema
  - Update MongoDB indexes for efficient querying
  - _Requirements: 1.1, 15.1_

- [X] 1.2 Create UserProgress model
  - Define UserProgress schema with userId, questionId, state, counts
  - Create unique index on `uniqueIndex` field
  - Create compound index on `userId` and `state`
  - _Requirements: 2.1, 4.1, 15.2_

- [X] 1.3 Create QuizSession model
  - Define QuizSession schema with TTL for 24-hour expiration
  - Create index on `sessionId` and `userId`
  - Configure TTL index on `expiresAt` field
  - _Requirements: 3.1, 3.5, 9.1_

---

## 2. Set Up AWS Amplify Authentication

- [ ] 2.1 Configure Amplify Auth with Cognito
  - Review existing `amplify/auth/resource.ts` configuration
  - Ensure email/password authentication is enabled
  - Configure password policy (min 8 chars, complexity requirements)
  - Enable email verification
  - _Requirements: 11.2, 11.3_

- [ ] 2.2 Test authentication flow
  - Create test user account
  - Verify email verification works
  - Test login and JWT token generation
  - Verify token contains user ID in claims
  - _Requirements: 11.3, 11.4_

---

## 3. Implement Lambda Utilities

- [ ] 3.1 Create structured logging module
  - Implement Logger interface with logEntry, logExit, logError, logInfo
  - Use JSON format for CloudWatch compatibility
  - Include requestId, timestamp, duration tracking
  - Implement sensitive data redaction
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 3.2 Create error handling module
  - Define AppError base class and specific error types
  - Implement error handler with structured error responses
  - Ensure errors are logged with full context
  - _Requirements: 13.3, 15.4_

- [ ] 3.3 Create MongoDB connection module
  - Implement connection pooling with cached connection
  - Load MONGO_URI from environment/Secrets Manager
  - Add connection error handling and retry logic
  - Log connection events
  - _Requirements: 12.4, 13.6, 15.4_

---

## 4. Implement Core Quiz Service Functions

- [ ] 4.1 Implement getExams function
  - Query MongoDB for unique exam numbers and names
  - Sort results alphabetically by exam number
  - Return array of Exam objects
  - Add logging for entry/exit/errors
  - _Requirements: 1.1, 13.1, 13.2_

- [ ] 4.2 Implement getSubDomains function
  - Query MongoDB for subdomains filtered by exam number
  - Sort by subdomain number
  - Return array of SubDomain objects
  - Add logging
  - _Requirements: 1.2, 13.1, 13.2_

- [ ] 4.3 Implement getQuestionCount function
  - Count questions matching exam, subdomain, and state filters
  - Join with UserProgress to determine current state
  - Exclude MASTERED questions
  - Add logging
  - _Requirements: 1.3, 2.3, 13.1_

- [ ] 4.4 Implement startQuiz function
  - Filter questions by exam, subdomain, and states
  - Exclude MASTERED questions for the user
  - Shuffle questions using Fisher-Yates algorithm
  - Apply maxQuestions limit
  - Create QuizSession document with 24-hour expiration
  - Return session ID and metadata
  - Add comprehensive logging
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4, 3.6, 9.1, 13.1, 13.2_

- [ ] 4.5 Implement getCurrentQuestion function
  - Retrieve QuizSession by sessionId and userId
  - Validate session ownership
  - Get current question from session.questions array
  - Shuffle options for display
  - Return question data with session statistics
  - Add logging
  - _Requirements: 3.7, 11.5, 13.1_

- [ ] 4.6 Implement submitAnswer function
  - Retrieve QuizSession and validate ownership
  - Parse correct answer(s) from question
  - Compare selected answers with correct answers (all-or-nothing)
  - Update UserProgress state and counts
  - Increment session counters
  - Move to next question
  - Return feedback with explanation
  - Add logging
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 11.5, 13.1, 15.2_

- [ ] 4.7 Implement markAsMastered function
  - Update UserProgress state to MASTERED
  - Validate user owns the progress record
  - Add logging
  - _Requirements: 2.4, 11.5, 13.1_

---

## 5. Update AppSync GraphQL Schema

- [ ] 5.1 Define GraphQL types and inputs
  - Update `amplify/data/resource.ts` with complete schema
  - Define Exam, SubDomain, QuestionData, QuizSession types
  - Define QuestionFilters, QuizFilters, AnswerSubmission inputs
  - Add Cognito authorization directives
  - _Requirements: 11.7, 12.6_

- [ ] 5.2 Define GraphQL queries
  - Add getExams query
  - Add getSubDomains query
  - Add getQuestionCount query
  - Add startQuiz query
  - Add getCurrentQuestion query
  - Link all queries to Lambda resolver
  - _Requirements: 1.1, 1.2, 2.3, 3.1_

- [ ] 5.3 Define GraphQL mutations
  - Add submitAnswer mutation
  - Add markAsMastered mutation
  - Link mutations to Lambda resolver
  - _Requirements: 4.1, 2.4_

---

## 6. Implement Lambda Handler

- [ ] 6.1 Create main Lambda handler
  - Extract userId from Cognito JWT token context
  - Route requests based on fieldName
  - Call appropriate service function
  - Handle errors with error handler
  - Add entry/exit logging
  - _Requirements: 11.4, 13.1, 13.2, 13.3_

- [ ] 6.2 Update Lambda function configuration
  - Set timeout to 30 seconds
  - Set memory to 512 MB
  - Configure environment variables (DB_NAME, LOG_LEVEL)
  - Link MONGO_URI secret
  - _Requirements: 12.5, 13.7_

---

## 7. Update Frontend Components

- [ ] 7.1 Add authentication UI
  - Use Amplify UI Authenticator component
  - Configure sign-up and sign-in forms
  - Handle authentication state
  - Store user session
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 7.2 Update QuizBuilder component
  - Add exam dropdown (calls getExams)
  - Add subdomain dropdown (calls getSubDomains with selected exam)
  - Add state checkboxes (New, Wrong, Right)
  - Add max questions input
  - Show question count preview
  - Call startQuiz mutation on submit
  - _Requirements: 1.1, 1.2, 1.4, 2.3, 3.1, 3.3_

- [ ] 7.3 Update QuizCard component
  - Display current question from getCurrentQuestion
  - Show shuffled options
  - Handle single/multi-answer selection
  - Call submitAnswer mutation
  - Show feedback with explanation
  - Display session progress
  - Handle quiz completion with summary
  - _Requirements: 3.7, 4.1, 4.2, 4.3, 4.5_

- [ ] 7.4 Add "Mark as Mastered" button
  - Add button to QuizCard
  - Call markAsMastered mutation
  - Show confirmation
  - _Requirements: 2.4_

---

## 8. Testing and Validation

- [ ] 8.1 Test authentication flow end-to-end
  - Sign up new user
  - Verify email
  - Log in
  - Verify JWT token is sent with requests
  - Test logout
  - _Requirements: 11.1, 11.2, 11.3, 11.6_

- [ ] 8.2 Test quiz flow end-to-end
  - Select exam and filters
  - Start quiz session
  - Answer questions (correct and incorrect)
  - Verify progress updates
  - Complete quiz and view summary
  - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.7, 4.1-4.5_

- [ ] 8.3 Test multi-user isolation
  - Create two user accounts
  - Have both users take quizzes
  - Verify each user sees only their own progress
  - Verify sessions are isolated
  - _Requirements: 11.5, 11.7_

- [ ] 8.4 Test session cleanup
  - Create quiz session
  - Wait 24+ hours (or manually expire)
  - Verify session is auto-deleted by TTL index
  - _Requirements: 9.1, 9.2_

- [ ] 8.5 Review CloudWatch logs
  - Verify structured JSON logging
  - Check ENTRY/EXIT/ERROR patterns
  - Verify sensitive data is redacted
  - Test log queries with CloudWatch Insights
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

---

## 9. Documentation and Code Quality

- [ ] 9.1 Add JSDoc comments to all functions
  - Document parameters, return types, exceptions
  - Add usage examples
  - _Requirements: 14.1, 14.2_

- [ ] 9.2 Add file headers with version info
  - Include file purpose, author, version, date
  - _Requirements: 14.3_

- [ ] 9.3 Create README.md
  - Document architecture
  - Add setup instructions
  - Document API endpoints
  - Add troubleshooting guide
  - _Requirements: 14.6_

- [ ] 9.4 Document environment variables
  - List all required variables
  - Explain purpose of each
  - Document how to set secrets
  - _Requirements: 14.7_

---

## 10. Deployment and Monitoring

- [ ] 10.1 Deploy to Amplify sandbox
  - Run `npx ampx sandbox`
  - Verify all resources deploy successfully
  - Test in sandbox environment
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 10.2 Set up CloudWatch dashboard
  - Add Lambda invocation metrics
  - Add Lambda error rate
  - Add Lambda duration (p50, p95, p99)
  - Add Cognito sign-in metrics
  - _Requirements: 13.1, 13.2_

- [ ] 10.3 Configure CloudWatch alarms
  - Lambda error rate > 5%
  - Lambda duration > 25 seconds
  - _Requirements: 13.3_

- [ ] 10.4 Test production deployment
  - Deploy to production branch
  - Verify all functionality works
  - Monitor logs and metrics
  - _Requirements: 12.1, 12.2, 12.3_

---

## Phase 1 Completion Checklist

- [ ] All core quiz features working
- [ ] Authentication and user isolation working
- [ ] Progress tracking persisting correctly
- [ ] Logging and monitoring in place
- [ ] Code documented with JSDoc
- [ ] README and setup docs complete
- [ ] Deployed to production
- [ ] You and your brother can use it!

---

**Next Phase:** Once Phase 1 is complete and stable, we'll move to Phase 2 (Dashboard & Analytics).
