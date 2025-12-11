// Demo mode utilities and types

export interface DemoQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string;
  examNumber: string;
  examName: string;
  subDomain: string;
  difficulty: string;
}

export interface DemoSession {
  sessionId: string;
  startTime: Date;
  questions: DemoQuestion[];
  currentIndex: number;
  answers: DemoAnswer[];
  completed: boolean;
}

export interface DemoAnswer {
  questionId: string;
  selectedLetters: string[];
  isCorrect: boolean;
  timestamp: Date;
}

// Demo mode detection
export const isDemoMode = (): boolean => {
  return window.location.pathname.startsWith('/demo');
};

// Generate a unique session ID
export const generateSessionId = (): string => {
  return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Shuffle array using Fisher-Yates algorithm
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Load demo questions from the JSON file
export const loadDemoQuestions = async (): Promise<DemoQuestion[]> => {
  try {
    // In a real implementation, this would fetch from the portfolio-assets folder
    // For now, we'll return the sample questions directly
    const sampleQuestions: DemoQuestion[] = [
      {
        id: "demo-1",
        questionText: "Which AWS service provides a managed NoSQL database with single-digit millisecond latency?",
        optionA: "Amazon RDS",
        optionB: "Amazon DynamoDB", 
        optionC: "Amazon ElastiCache",
        optionD: "Amazon DocumentDB",
        answer: "B",
        explanation: "Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability. It offers single-digit millisecond latency for read and write operations.",
        examNumber: "DEMO",
        examName: "Professional Certification Demo",
        subDomain: "Database Services",
        difficulty: "intermediate"
      },
      {
        id: "demo-2", 
        questionText: "What is the primary benefit of using AWS Lambda for serverless computing?",
        optionA: "Always-on server instances",
        optionB: "Pay only for compute time used",
        optionC: "Requires manual scaling",
        optionD: "Fixed monthly pricing",
        answer: "B",
        explanation: "AWS Lambda follows a pay-per-use pricing model where you only pay for the compute time your code actually consumes. There are no charges when your code is not running, making it very cost-effective for event-driven applications.",
        examNumber: "DEMO",
        examName: "Professional Certification Demo", 
        subDomain: "Compute Services",
        difficulty: "beginner"
      },
      {
        id: "demo-3",
        questionText: "Which AWS service would you use to create a GraphQL API with real-time subscriptions?",
        optionA: "Amazon API Gateway",
        optionB: "AWS AppSync",
        optionC: "Amazon CloudFront", 
        optionD: "AWS Direct Connect",
        answer: "B",
        explanation: "AWS AppSync is a managed GraphQL service that makes it easy to develop GraphQL APIs by handling the heavy lifting of securely connecting to data sources like DynamoDB, Lambda, and more. It includes built-in support for real-time subscriptions.",
        examNumber: "DEMO",
        examName: "Professional Certification Demo",
        subDomain: "Application Integration", 
        difficulty: "intermediate"
      },
      {
        id: "demo-4",
        questionText: "What is the maximum execution time for an AWS Lambda function?",
        optionA: "5 minutes",
        optionB: "10 minutes", 
        optionC: "15 minutes",
        optionD: "30 minutes",
        answer: "C",
        explanation: "AWS Lambda functions can run for a maximum of 15 minutes (900 seconds). This timeout can be configured when creating or updating the function, with the default being 3 seconds.",
        examNumber: "DEMO", 
        examName: "Professional Certification Demo",
        subDomain: "Compute Services",
        difficulty: "beginner"
      },
      {
        id: "demo-5",
        questionText: "Which AWS service provides user authentication and authorization for web and mobile applications?",
        optionA: "AWS IAM",
        optionB: "Amazon Cognito",
        optionC: "AWS Directory Service",
        optionD: "AWS SSO",
        answer: "B", 
        explanation: "Amazon Cognito provides authentication, authorization, and user management for web and mobile apps. It supports user sign-up, sign-in, and access control, and can scale to millions of users while integrating with social identity providers.",
        examNumber: "DEMO",
        examName: "Professional Certification Demo",
        subDomain: "Security & Identity",
        difficulty: "intermediate"
      }
    ];

    // Shuffle the questions for variety
    return shuffleArray(sampleQuestions);
  } catch (error) {
    console.error('Error loading demo questions:', error);
    return [];
  }
};

// Initialize a new demo session
export const initializeDemoSession = async (): Promise<DemoSession> => {
  const questions = await loadDemoQuestions();
  const session: DemoSession = {
    sessionId: generateSessionId(),
    startTime: new Date(),
    questions,
    currentIndex: 0,
    answers: [],
    completed: false
  };

  // Save to localStorage
  localStorage.setItem('demoSession', JSON.stringify(session));
  return session;
};

// Get current demo session from localStorage
export const getDemoSession = (): DemoSession | null => {
  try {
    const sessionData = localStorage.getItem('demoSession');
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    // Convert date strings back to Date objects
    session.startTime = new Date(session.startTime);
    session.answers = session.answers.map((answer: any) => ({
      ...answer,
      timestamp: new Date(answer.timestamp)
    }));
    
    return session;
  } catch (error) {
    console.error('Error loading demo session:', error);
    return null;
  }
};

// Save demo session to localStorage
export const saveDemoSession = (session: DemoSession): void => {
  try {
    localStorage.setItem('demoSession', JSON.stringify(session));
  } catch (error) {
    console.error('Error saving demo session:', error);
  }
};

// Clear demo session from localStorage
export const clearDemoSession = (): void => {
  localStorage.removeItem('demoSession');
};