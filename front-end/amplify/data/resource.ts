// File: amplify/data/resource.ts

import { type ClientSchema, defineData } from '@aws-amplify/backend';
// We only need 'a' for schema definition in this version
import { a } from '@aws-amplify/data-schema'; 
// FIX: We must import from the definition file, not the handler file.
import { mongoConnector } from '../functions/mongo-connector'; 

const schema = a.schema({
  // ============================================================================
  // CUSTOM TYPES
  // ============================================================================
  
  Exam: a.customType({
    number: a.string().required(),
    name: a.string().required(),
    display: a.string().required(),
  }),
  
  SubDomain: a.customType({
    num: a.float().required(),
    name: a.string().required(),
  }),
  
  QuizSession: a.customType({
    sessionId: a.id().required(),
    total: a.integer().required(),
    examNumber: a.string().required(),
    examName: a.string().required(),
    subDomain: a.string().required(),
  }),
  
  QuestionOption: a.customType({
    letter: a.string().required(),
    text: a.string().required(),
  }),
  
  QuestionData: a.customType({
    questionNumber: a.integer().required(),
    total: a.integer().required(),
    question: a.string().required(),
    options: a.ref('QuestionOption').array().required(),
    isMulti: a.boolean().required(),
    questionType: a.integer().required(),
    rowNum: a.integer().required(),
    subDomain: a.string().required(),
    countRight: a.integer().required(),
    countWrong: a.integer().required(),
    sessionCorrect: a.integer().required(),
    sessionWrong: a.integer().required(),
    originalNumber: a.string().required(),
  }),
  
  QuizSummary: a.customType({
    correct: a.integer().required(),
    total: a.integer().required(),
    percentage: a.integer().required(),
  }),
  
  AnswerFeedback: a.customType({
    isCorrect: a.boolean().required(),
    correctLetters: a.string().array().required(),
    selectedLetters: a.string().array().required(),
    explanation: a.string().required(),
    countRight: a.integer().required(),
    countWrong: a.integer().required(),
    isComplete: a.boolean().required(),
    summary: a.ref('QuizSummary'),
  }),
  
  // ============================================================================
  // QUERIES
  // ============================================================================
  
  getExams: a.query()
    .returns(a.ref('Exam').array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
  
  getSubDomains: a.query()
    .arguments({ examNumber: a.string().required() })
    .returns(a.ref('SubDomain').array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
  
  getQuestionCount: a.query()
    .arguments({
      examNumber: a.string().required(),
      subDomain: a.string(),
      states: a.string().array().required(),
    })
    .returns(a.integer())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
  
  startQuiz: a.query()
    .arguments({
      examNumber: a.string().required(),
      examName: a.string().required(),
      subDomain: a.string(),
      states: a.string().array().required(),
      maxQuestions: a.integer(),
    })
    .returns(a.ref('QuizSession'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
  
  getCurrentQuestion: a.query()
    .arguments({ sessionId: a.id().required() })
    .returns(a.ref('QuestionData'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
  
  // ============================================================================
  // MUTATIONS
  // ============================================================================
  
  submitAnswer: a.mutation()
    .arguments({
      sessionId: a.id().required(),
      questionId: a.id().required(),
      selectedLetters: a.string().array().required(),
    })
    .returns(a.ref('AnswerFeedback'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
  
  markAsMastered: a.mutation()
    .arguments({ questionId: a.id().required() })
    .returns(a.boolean())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(mongoConnector)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',  // Use Cognito authentication
    // Keep API key as secondary for development/testing
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});