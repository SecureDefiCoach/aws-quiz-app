# AWS Quiz App - Chatbot Knowledge Base

## About the Application

### What is the AWS Quiz App?
The AWS Quiz Application is a full-stack web application designed for AWS certification exam preparation. It provides adaptive learning through progress tracking, allowing users to focus on questions they haven't mastered while tracking their performance across multiple AWS certification exams.

### Key Features
- **Multi-exam support**: Currently supports SCS-C02 (AWS Security Specialty), with plans for CompTIA+ and ISACA certifications
- **Adaptive learning**: Excludes questions users have already mastered
- **Progress tracking**: Tracks user performance with states (New, Wrong, Right, Mastered)
- **User authentication**: Secure login with AWS Cognito
- **Admin panel**: Content management for administrators
- **Responsive design**: Works on desktop and mobile devices
- **Demo mode**: Try 5 sample questions without signing up

## Technical Architecture

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: CSS with responsive design
- **Authentication**: AWS Amplify Auth with Cognito
- **API**: GraphQL with AWS AppSync
- **Hosting**: AWS Amplify

### Backend
- **API**: AWS AppSync (GraphQL)
- **Compute**: AWS Lambda (Node.js/TypeScript)
- **Database**: MongoDB Atlas
- **Authentication**: AWS Cognito
- **Monitoring**: CloudWatch

### Key Technologies
- React, TypeScript, AWS Amplify, AppSync, Lambda, Cognito, MongoDB
- GraphQL for API layer
- Serverless architecture for scalability
- Infrastructure as Code with AWS CDK

## Developer Information

### About the Developer
This application was built by Tristan Marvin as a portfolio project demonstrating full-stack development skills and AWS expertise. The project showcases:

- **Full-stack development**: Frontend and backend integration
- **Cloud architecture**: AWS serverless technologies
- **Database design**: MongoDB schema and optimization
- **Security**: Authentication, authorization, and data protection
- **DevOps**: CI/CD pipelines and monitoring
- **Problem-solving**: Migration from legacy Google Apps Script system

### Skills Demonstrated
- **Frontend**: React, TypeScript, CSS, Responsive Design, User Experience
- **Backend**: Node.js, GraphQL, Lambda Functions, API Design
- **Cloud**: AWS (Amplify, AppSync, Cognito, Lambda, CloudWatch)
- **Database**: MongoDB, Schema Design, Query Optimization
- **Security**: Authentication, Authorization, Data Encryption
- **DevOps**: CI/CD, Infrastructure as Code, Monitoring, Logging

## Getting Started

### How to Try the Demo
1. Visit the application homepage
2. Click "Try Demo" button
3. Answer 5 sample AWS questions
4. See your results and explanations
5. Sign up for the full experience with hundreds of questions

### How to Sign Up
1. Click "Sign Up" on the homepage
2. Enter your email and create a password
3. Verify your email address
4. Start taking quizzes immediately

### How to Use the Quiz
1. Log in to your account
2. Go to "Start Quiz" 
3. Select an exam (currently SCS-C02)
4. Choose a subdomain or select "All"
5. Pick question states (New, Wrong, Right)
6. Set maximum questions or choose "All"
7. Start your quiz and track your progress

## Common Questions

### Is this free to use?
Yes, the application is free to use. It's hosted on AWS free tier resources.

### What exams are supported?
Currently supports AWS SCS-C02 (Security Specialty). Plans to add CompTIA+ and ISACA certifications.

### How does progress tracking work?
- **New**: Questions you haven't answered yet
- **Wrong**: Questions you've answered incorrectly
- **Right**: Questions you've answered correctly
- **Mastered**: Questions you've answered correctly 3+ times (excluded from future quizzes)

### Can I use this on mobile?
Yes, the application is fully responsive and works well on mobile devices.

### How do I contact the developer?
You can reach Tristan Marvin at tristanmarvin@outlook.com for questions about the application or potential opportunities.

## Technical Details

### Architecture Decisions
- **Why serverless?**: Cost-effective, scalable, and demonstrates modern cloud practices
- **Why GraphQL?**: Type-safe API with real-time capabilities and efficient data fetching
- **Why MongoDB?**: Flexible schema for different exam types and question formats
- **Why TypeScript?**: Type safety and better developer experience

### Security Features
- User authentication with AWS Cognito
- Data encryption in transit and at rest
- User data isolation
- Secure API endpoints
- Input validation and sanitization

### Performance Optimizations
- Database indexing for fast queries
- Connection pooling for Lambda functions
- Efficient GraphQL queries
- Responsive design for all devices
- CloudWatch monitoring and alarms

## Future Roadmap

### Planned Features
- CSV import system for new exam types
- AI-powered question generation
- Advanced analytics and reporting
- Offline quiz capability
- Mobile app development
- Integration with learning management systems

### Career Goals
This project demonstrates skills relevant to:
- Full-stack development roles
- Cloud architecture positions
- AI transformation initiatives
- DevOps and platform engineering
- Technical leadership opportunities