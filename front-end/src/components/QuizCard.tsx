import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

interface QuizCardProps {
  sessionId: string;
  onComplete: () => void;
}

interface QuestionOption {
  letter: string;
  text: string;
}

interface QuestionData {
  questionNumber: number;
  total: number;
  question: string;
  options: QuestionOption[];
  isMulti: boolean;
  questionType: number;
  rowNum: number;
  subDomain: string;
  countRight: number;
  countWrong: number;
  sessionCorrect: number;
  sessionWrong: number;
  originalNumber: string;
}

interface AnswerFeedback {
  isCorrect: boolean;
  correctLetters: string[];
  selectedLetters: string[];
  explanation: string;
  countRight: number;
  countWrong: number;
  isComplete: boolean;
  summary?: {
    correct: number;
    total: number;
    percentage: number;
  };
}

function QuizCard({ sessionId, onComplete }: QuizCardProps) {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, [sessionId]);

  const loadQuestion = async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setSelectedAnswers([]);

    try {
      const client = generateClient<Schema>();
      const { data } = await client.queries.getCurrentQuestion({ sessionId });
      
      if (!data) {
        // Quiz is complete
        onComplete();
        return;
      }

      setQuestion(data);
    } catch (err) {
      console.error('Error loading question:', err);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerToggle = (letter: string) => {
    if (feedback) return; // Don't allow changes after submission

    if (question?.isMulti) {
      // Multi-select
      setSelectedAnswers(prev =>
        prev.includes(letter)
          ? prev.filter(l => l !== letter)
          : [...prev, letter]
      );
    } else {
      // Single select
      setSelectedAnswers([letter]);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0 || !question) return;

    setLoading(true);
    setError(null);

    try {
      const client = generateClient<Schema>();
      const { data } = await client.mutations.submitAnswer({
        sessionId,
        questionId: question.rowNum.toString(),
        selectedLetters: selectedAnswers,
      });

      if (data) {
        setFeedback(data);
        // Show explanation expanded if wrong, collapsed if correct
        setShowExplanation(!data.isCorrect);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (feedback?.isComplete) {
      setShowSummary(true);
    } else {
      loadQuestion();
    }
  };

  if (loading && !question) {
    return <div className="loading">Loading question...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">{error}</div>
        <button className="btn-primary" onClick={onComplete}>
          Back to Quiz Builder
        </button>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  // Show summary if user clicked to view it
  if (showSummary && feedback?.summary) {
    return (
      <div className="card">
        <h2>Quiz Complete! 🎉</h2>
        <div className="quiz-summary">
          <p className="summary-stat">
            Score: {feedback.summary.correct} / {feedback.summary.total}
          </p>
          <p className="summary-stat">
            Percentage: {feedback.summary.percentage}%
          </p>
        </div>
        <button className="btn-primary" onClick={onComplete}>
          Start New Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-card">
      <div className="card">
        <div className="quiz-header">
          <h3>
            Question {question.questionNumber} of {question.total}
          </h3>
          <div className="quiz-stats">
            <span className="stat-correct">✓ {question.sessionCorrect}</span>
            <span className="stat-wrong">✗ {question.sessionWrong}</span>
          </div>
        </div>

        <div className="question-meta">
          <span className="subdomain">{question.subDomain}</span>
          {question.isMulti && (
            <span className="multi-badge">Multiple Answers</span>
          )}
        </div>

        <div className="question-text">
          <p>{question.question}</p>
        </div>

        <div className="options">
          {question.options.map(option => (
            <div
              key={option.letter}
              className={`option ${
                selectedAnswers.includes(option.letter) ? 'selected' : ''
              } ${
                feedback
                  ? feedback.correctLetters.includes(option.letter)
                    ? 'correct'
                    : feedback.selectedLetters.includes(option.letter)
                    ? 'incorrect'
                    : ''
                  : ''
              }`}
              onClick={() => handleAnswerToggle(option.letter)}
            >
              <span className="option-text">{option.text}</span>
            </div>
          ))}
        </div>

        {feedback && (
          <div className="feedback">
            {feedback.explanation && (
              <div className="explanation-section">
                <button 
                  className="explanation-toggle"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  {showExplanation ? '▼' : '▶'} Explanation
                </button>
                {showExplanation && (
                  <p className="explanation">{feedback.explanation}</p>
                )}
              </div>
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="quiz-actions">
          {!feedback ? (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || selectedAnswers.length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleNext}>
              {feedback.isComplete ? 'View Results' : 'Next Question'}
            </button>
          )}
        </div>

        {question.originalNumber && (
          <div className="question-reference">
            Question #{question.originalNumber}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizCard;
