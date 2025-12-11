import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  DemoSession, 
  DemoQuestion, 
  DemoAnswer,
  initializeDemoSession,
  getDemoSession,
  saveDemoSession,
  clearDemoSession
} from '../utils/demoMode';

// Demo Mode State
interface DemoModeState {
  session: DemoSession | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Demo Mode Actions
type DemoModeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: DemoSession | null }
  | { type: 'INITIALIZE_SESSION'; payload: DemoSession }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; selectedLetters: string[]; isCorrect: boolean } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: DemoModeState = {
  session: null,
  loading: false,
  error: null,
  isInitialized: false
};

// Reducer
const demoModeReducer = (state: DemoModeState, action: DemoModeAction): DemoModeState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SESSION':
      return { ...state, session: action.payload, loading: false, error: null };
    
    case 'INITIALIZE_SESSION':
      return { 
        ...state, 
        session: action.payload, 
        loading: false, 
        error: null,
        isInitialized: true 
      };
    
    case 'ANSWER_QUESTION':
      if (!state.session) return state;
      
      const newAnswer: DemoAnswer = {
        questionId: action.payload.questionId,
        selectedLetters: action.payload.selectedLetters,
        isCorrect: action.payload.isCorrect,
        timestamp: new Date()
      };
      
      const updatedSession = {
        ...state.session,
        answers: [...state.session.answers, newAnswer]
      };
      
      return { ...state, session: updatedSession };
    
    case 'NEXT_QUESTION':
      if (!state.session) return state;
      
      const nextSession = {
        ...state.session,
        currentIndex: Math.min(state.session.currentIndex + 1, state.session.questions.length - 1)
      };
      
      return { ...state, session: nextSession };
    
    case 'COMPLETE_SESSION':
      if (!state.session) return state;
      
      const completedSession = {
        ...state.session,
        completed: true
      };
      
      return { ...state, session: completedSession };
    
    case 'CLEAR_SESSION':
      return { 
        ...state, 
        session: null, 
        isInitialized: false,
        error: null 
      };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    default:
      return state;
  }
};

// Context
interface DemoModeContextType {
  state: DemoModeState;
  startNewSession: () => Promise<void>;
  loadExistingSession: () => void;
  answerQuestion: (questionId: string, selectedLetters: string[], isCorrect: boolean) => void;
  nextQuestion: () => void;
  completeSession: () => void;
  clearSession: () => void;
  getCurrentQuestion: () => DemoQuestion | null;
  getProgress: () => { current: number; total: number; percentage: number };
  getScore: () => { correct: number; total: number; percentage: number };
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

// Provider Props
interface DemoModeProviderProps {
  children: ReactNode;
}

// Provider Component
export const DemoModeProvider: React.FC<DemoModeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(demoModeReducer, initialState);

  // Load existing session on mount
  useEffect(() => {
    const existingSession = getDemoSession();
    if (existingSession) {
      dispatch({ type: 'SET_SESSION', payload: existingSession });
    }
    dispatch({ type: 'SET_INITIALIZED', payload: true });
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (state.session && state.isInitialized) {
      saveDemoSession(state.session);
    }
  }, [state.session, state.isInitialized]);

  // Actions
  const startNewSession = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      clearDemoSession();
      const newSession = await initializeDemoSession();
      dispatch({ type: 'INITIALIZE_SESSION', payload: newSession });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start demo session' });
      console.error('Error starting demo session:', error);
    }
  };

  const loadExistingSession = (): void => {
    const existingSession = getDemoSession();
    dispatch({ type: 'SET_SESSION', payload: existingSession });
  };

  const answerQuestion = (questionId: string, selectedLetters: string[], isCorrect: boolean): void => {
    dispatch({ 
      type: 'ANSWER_QUESTION', 
      payload: { questionId, selectedLetters, isCorrect } 
    });
  };

  const nextQuestion = (): void => {
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const completeSession = (): void => {
    dispatch({ type: 'COMPLETE_SESSION' });
  };

  const clearSession = (): void => {
    clearDemoSession();
    dispatch({ type: 'CLEAR_SESSION' });
  };

  const getCurrentQuestion = (): DemoQuestion | null => {
    if (!state.session || state.session.currentIndex >= state.session.questions.length) {
      return null;
    }
    return state.session.questions[state.session.currentIndex];
  };

  const getProgress = (): { current: number; total: number; percentage: number } => {
    if (!state.session) {
      return { current: 0, total: 0, percentage: 0 };
    }
    
    const current = state.session.currentIndex + 1;
    const total = state.session.questions.length;
    const percentage = Math.round((current / total) * 100);
    
    return { current, total, percentage };
  };

  const getScore = (): { correct: number; total: number; percentage: number } => {
    if (!state.session) {
      return { correct: 0, total: 0, percentage: 0 };
    }
    
    const correct = state.session.answers.filter(answer => answer.isCorrect).length;
    const total = state.session.answers.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { correct, total, percentage };
  };

  const contextValue: DemoModeContextType = {
    state,
    startNewSession,
    loadExistingSession,
    answerQuestion,
    nextQuestion,
    completeSession,
    clearSession,
    getCurrentQuestion,
    getProgress,
    getScore
  };

  return (
    <DemoModeContext.Provider value={contextValue}>
      {children}
    </DemoModeContext.Provider>
  );
};

// Hook to use demo mode context
export const useDemoMode = (): DemoModeContextType => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};