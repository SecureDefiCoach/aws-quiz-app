# Requirements Document

## Introduction

This spec covers the migration of a stateful quiz application from Google Apps Script/Google Sheets to AWS serverless architecture (AppSync → Lambda → MongoDB). The system provides adaptive learning through progress tracking, allowing users to focus on questions they haven't mastered while tracking their performance across multiple AWS certification exams. The application includes quiz sessions, flashcard study mode, dashboard analytics, and question management features.

## Glossary

- **Quiz System**: The complete application managing questions, user progress, and quiz sessions
- **Question**: A single quiz item with text, 4-6 options, correct answer, and explanation
- **User Progress**: Per-user, per-question state tracking (New, Wrong, Right, Mastered)
- **Exam**: An AWS certification exam identified by number (e.g., "SCS-C02") and name
- **Subdomain**: A topic category within an exam with a number (e.g., "1.2 Detection & Investigation")
- **State Filter**: Filtering questions based on user's progress state (New/Wrong/Right)
- **Quiz Session**: A randomized set of questions presented to a user based on filters
- **Flashcard**: A study card with front (question), hint, and back (answer) for memorization
- **Question Mark Type**: Classification for questions (None/Mark/Create More/Lab)
- **Session Storage**: Temporary storage in PropertiesService for active quiz/flashcard sessions

## Requirements

### Requirement 1: Multi-Exam Question Retrieval

**User Story:** As a quiz user, I want to select from multiple AWS certification exams and filter by subdomain, so that I can focus my study on specific exam topics.

#### Acceptance Criteria

1. WHEN a user requests available exams, THE Quiz System SHALL return unique exam numbers and names sorted alphabetically
2. WHEN a user selects an exam, THE Quiz System SHALL return subdomains for that exam sorted by subdomain number
3. WHEN a user requests questions for a specific exam, THE Quiz System SHALL return only questions matching that exam number
4. WHEN a user requests questions for a specific subdomain, THE Quiz System SHALL return only questions matching that subdomain within the selected exam
5. WHEN a user requests questions without subdomain filter, THE Quiz System SHALL return questions from all subdomains within the selected exam

### Requirement 2: State-Based Question Selection

**User Story:** As a quiz user, I want to receive questions I haven't mastered, so that I can focus on areas where I need improvement.

#### Acceptance Criteria

1. WHEN a user starts a quiz session, THE Quiz System SHALL exclude questions the user has marked as "Mastered"
2. WHEN a user has no progress on a question, THE Quiz System SHALL classify that question as "New"
3. WHEN a user answers a question incorrectly, THE Quiz System SHALL mark that question as "Wrong"
4. WHEN a user answers a question correctly, THE Quiz System SHALL update the question state based on attempt history
5. WHEN a user answers a question correctly three or more times, THE Quiz System SHALL mark that question as "Mastered"

### Requirement 3: Quiz Session Management

**User Story:** As a quiz user, I want to receive a randomized set of questions with a configurable limit, so that I can control my study session length.

#### Acceptance Criteria

1. WHEN a user starts a quiz session, THE Quiz System SHALL create a unique session identifier with timestamp
2. WHEN a user specifies a maximum question count, THE Quiz System SHALL return up to that many random questions from the filtered set
3. WHEN a user specifies zero as maximum, THE Quiz System SHALL return all matching questions
4. WHEN fewer questions match the filters than the maximum, THE Quiz System SHALL return all available questions
5. WHEN a quiz session is created, THE Quiz System SHALL store session data in temporary storage with a 24-hour expiration
6. WHEN questions are randomized, THE Quiz System SHALL shuffle using Fisher-Yates algorithm for equal probability
7. WHEN a quiz session completes, THE Quiz System SHALL provide summary statistics including correct count, total count, and percentage

### Requirement 4: Answer Submission and Progress Tracking

**User Story:** As a quiz user, I want my answers to be recorded and tracked, so that the system can adapt to my learning progress.

#### Acceptance Criteria

1. WHEN a user submits an answer, THE Quiz System SHALL record the attempt in the user's progress record
2. WHEN a user submits an answer, THE Quiz System SHALL increment the attempt count for that question
3. WHEN a user submits a correct answer, THE Quiz System SHALL update the question state appropriately
4. WHEN a user submits an incorrect answer, THE Quiz System SHALL reset the question state to "Wrong"
5. WHEN progress is updated, THE Quiz System SHALL persist changes to MongoDB immediately

### Requirement 5: Dashboard Statistics

**User Story:** As a quiz user, I want to see my overall progress statistics, so that I can track my learning journey.

#### Acceptance Criteria

1. WHEN a user views their dashboard, THE Quiz System SHALL display total questions attempted
2. WHEN a user views their dashboard, THE Quiz System SHALL display total correct answers
3. WHEN a user views their dashboard, THE Quiz System SHALL display the last completion timestamp
4. WHEN statistics are calculated, THE Quiz System SHALL aggregate data from all user progress records
5. WHEN a user completes a quiz session, THE Quiz System SHALL update their dashboard statistics

### Requirement 6: Question Marking System

**User Story:** As a quiz user, I want to mark questions for different purposes, so that I can organize questions for review, lab practice, or content creation.

#### Acceptance Criteria

1. WHEN a user marks a question, THE Quiz System SHALL store one of four mark types: None, Mark, Create More, or Lab
2. WHEN a user views a question, THE Quiz System SHALL display the current mark type
3. WHEN a user changes a mark type, THE Quiz System SHALL update the mark type immediately in the database
4. WHEN a user marks a question as "Mark", THE Quiz System SHALL flag it for general review
5. WHEN a user marks a question as "Create More", THE Quiz System SHALL flag it for variation generation
6. WHEN a user marks a question as "Lab", THE Quiz System SHALL flag it for hands-on practice

### Requirement 7: Flashcard Study System

**User Story:** As a quiz user, I want to study using flashcards with front/back format, so that I can memorize key concepts separately from quiz practice.

#### Acceptance Criteria

1. WHEN a user requests flashcard exams, THE Quiz System SHALL return unique exam identifiers from the flashcard collection
2. WHEN a user selects an exam, THE Quiz System SHALL return flashcard sets containing non-mastered cards
3. WHEN a user starts a flashcard session, THE Quiz System SHALL create a session with randomized cards excluding mastered cards
4. WHEN a user views a flashcard, THE Quiz System SHALL display front text, optional hint, and allow revealing the back
5. WHEN a user reviews a flashcard, THE Quiz System SHALL accept three actions: right, wrong, or mastered
6. WHEN a user marks a flashcard as right, THE Quiz System SHALL update state to Right and increment right count
7. WHEN a user marks a flashcard as wrong, THE Quiz System SHALL update state to Wrong and increment wrong count
8. WHEN a user marks a flashcard as mastered, THE Quiz System SHALL update state to Mastered and exclude from future sessions
9. WHEN a flashcard session completes, THE Quiz System SHALL provide summary with right, wrong, and mastered counts

### Requirement 8: Dashboard Analytics with Exam Filtering

**User Story:** As a quiz user, I want to see my progress grouped by subdomain with dynamic exam filtering and totals, so that I can track my study progress over weeks or months and identify weak areas.

#### Acceptance Criteria

1. WHEN a user views the dashboard, THE Quiz System SHALL display a dropdown to select an exam or "All Exams"
2. WHEN a user selects "All Exams", THE Quiz System SHALL display statistics for all questions grouped by subdomain across all exams
3. WHEN a user selects a specific exam, THE Quiz System SHALL display statistics filtered to that exam only
4. WHEN displaying subdomain statistics, THE Quiz System SHALL show subdomain ID, domain name, and counts for New, Right, Wrong, and Mastered states
5. WHEN displaying subdomain statistics, THE Quiz System SHALL sort by subdomain ID in ascending order
6. WHEN calculating totals, THE Quiz System SHALL sum all New, Right, Wrong, and Mastered counts matching the selected exam filter
7. WHEN a user updates question states, THE Quiz System SHALL reflect changes in the dashboard in real-time
8. WHEN displaying the dashboard, THE Quiz System SHALL show totals row at the bottom with aggregate counts
9. WHEN the exam filter changes, THE Quiz System SHALL recalculate both subdomain breakdowns and totals automatically

### Requirement 9: Session Cleanup and Quota Management

**User Story:** As a system administrator, I want automatic cleanup of old sessions, so that storage limits are not exceeded.

#### Acceptance Criteria

1. WHEN a new quiz or flashcard session starts, THE Quiz System SHALL clean up sessions older than 24 hours
2. WHEN cleaning sessions, THE Quiz System SHALL delete all quiz and flashcard session data from temporary storage
3. WHEN more than 5 recent sessions exist, THE Quiz System SHALL keep only the 5 newest sessions
4. WHEN quota usage is requested, THE Quiz System SHALL calculate total storage size and percentage used
5. WHEN quota usage exceeds 80 percent, THE Quiz System SHALL log a warning

### Requirement 10: AI-Assisted Question Generation

**User Story:** As a content creator, I want to generate new questions and variations using AI, so that I can expand my question bank efficiently.

#### Acceptance Criteria

1. WHEN a user requests question variations, THE Quiz System SHALL identify questions with high wrong counts as candidates
2. WHEN a user selects a source question, THE Quiz System SHALL generate a prompt including the question text, options, answer, and performance statistics
3. WHEN generating variations, THE Quiz System SHALL create prompts that maintain the same learning objective but vary scenarios and wording
4. WHEN generating new questions, THE Quiz System SHALL create prompts specifying exam, subdomain, quantity, and context from study materials
5. WHEN AI generates questions, THE Quiz System SHALL output semicolon-delimited format with 14 columns
6. WHEN AI output is received, THE Quiz System SHALL parse semicolon-delimited text handling quoted fields and escaped quotes
7. WHEN parsing AI output, THE Quiz System SHALL map fields to question columns and set initial state to New
8. WHEN parsing fails for a row, THE Quiz System SHALL skip that row and continue processing remaining rows

### Requirement 11: Multi-User Authentication

**User Story:** As a quiz user, I want to create my own account and track my progress separately from other users, so that I can study independently while sharing the same question bank.

#### Acceptance Criteria

1. WHEN a new user visits the application, THE Quiz System SHALL provide options to sign up or log in
2. WHEN a user signs up, THE Quiz System SHALL create an account with email and password
3. WHEN a user logs in, THE Quiz System SHALL authenticate credentials and create a session
4. WHEN a user is authenticated, THE Quiz System SHALL use their unique user ID for all progress tracking
5. WHEN retrieving progress data, THE Quiz System SHALL filter by the authenticated user's ID
6. WHEN a user logs out, THE Quiz System SHALL clear the session and require re-authentication
7. WHEN multiple users use the application, THE Quiz System SHALL isolate each user's progress data

### Requirement 12: Data Security and Encryption

**User Story:** As a content owner, I want all question data encrypted at rest and in transit, so that my intellectual property is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN data is stored in MongoDB, THE Quiz System SHALL use encryption at rest for all question and user data
2. WHEN data is transmitted between client and AppSync, THE Quiz System SHALL use HTTPS/TLS encryption
3. WHEN data is transmitted between AppSync and Lambda, THE Quiz System SHALL use AWS internal encrypted channels
4. WHEN data is transmitted between Lambda and MongoDB, THE Quiz System SHALL use TLS/SSL encrypted connections
5. WHEN storing sensitive configuration, THE Quiz System SHALL use AWS Secrets Manager or Systems Manager Parameter Store
6. WHEN API keys are required, THE Quiz System SHALL never expose them in client-side code or logs
7. WHEN authentication tokens are issued, THE Quiz System SHALL use secure JWT tokens with expiration

### Requirement 13: Logging and Observability

**User Story:** As a developer, I want structured logging and error tracking, so that I can quickly troubleshoot issues in production using CloudWatch.

#### Acceptance Criteria

1. WHEN a Lambda function is invoked, THE Quiz System SHALL log entry with function name, timestamp, and input parameters
2. WHEN a Lambda function completes, THE Quiz System SHALL log exit with duration and result status
3. WHEN an error occurs, THE Quiz System SHALL log error with message, stack trace, and context data
4. WHEN logging to CloudWatch, THE Quiz System SHALL use structured JSON format for easy querying
5. WHEN logging sensitive data, THE Quiz System SHALL redact passwords, tokens, and API keys
6. WHEN a database operation executes, THE Quiz System SHALL log operation type, collection, and execution time
7. WHEN logging levels are configured, THE Quiz System SHALL support INFO, WARN, and ERROR levels

### Requirement 14: Code Quality and Documentation

**User Story:** As a developer, I want well-documented code with version control, so that the codebase is maintainable and changes are traceable.

#### Acceptance Criteria

1. WHEN code is written, THE Quiz System SHALL include JSDoc comments for all functions with parameters and return types
2. WHEN functions are created, THE Quiz System SHALL include inline comments explaining complex logic
3. WHEN files are created, THE Quiz System SHALL include header comments with purpose, author, and version
4. WHEN code is committed, THE Quiz System SHALL use semantic commit messages following conventional commits format
5. WHEN breaking changes are made, THE Quiz System SHALL update version numbers following semantic versioning
6. WHEN APIs are defined, THE Quiz System SHALL document input schemas, output schemas, and error responses
7. WHEN configuration changes, THE Quiz System SHALL document environment variables and their purposes

### Requirement 15: Data Persistence and Retrieval

**User Story:** As a system administrator, I want all quiz data and user progress stored reliably, so that users never lose their learning history.

#### Acceptance Criteria

1. WHEN questions are imported, THE Quiz System SHALL store all question fields including options A-F, answer, explanation, exam metadata, and subdomain information
2. WHEN user progress is saved, THE Quiz System SHALL update state columns and increment attempt counts atomically
3. WHEN retrieving questions, THE Quiz System SHALL include all metadata fields for display and filtering
4. WHEN database operations fail, THE Quiz System SHALL return appropriate error messages with context
5. WHEN concurrent updates occur, THE Quiz System SHALL use row-level locking to prevent race conditions
