import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '../contexts/DemoModeContext';

export default function DemoQuizCard() {
  const navigate = useNavigate();
  const { 
    state, 
    getCurrentQuestion, 
    answerQuestion, 
    nextQuestion, 
    completeSession,
    getProgress,
    getScore 
  } = useDemoMode();

  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [markType, setMarkType] = useState(0);

  const question = getCurrentQuestion();
  const progress = getProgress();
  const score = getScore();

  // Redirect if no session or completed
  useEffect(() => {
    if (!state.session) {
      navigate('/demo/app/quiz');
      return;
    }
    
    if (state.session.completed) {
      navigate('/demo/app/dashboard');
      return;
    }
  }, [state.session, navigate]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedLetters([]);
    setFeedback(null);
    setShowExplanation(false);
    setMarkType(0);
  }, [question?.id]);

  if (!question) {
    return (
      <div className="loading">
        <p>Loading demo question...</p>
      </div>
    );
  }

  const handleOptionSelect = (letter: string) => {
    if (feedback) return; // Don't allow changes after submission
    
    // For demo, assume single answer questions
    setSelectedLetters([letter]);
  };

  const handleSubmit = () => {
    if (selectedLetters.length === 0) return;

    const correctLetters = [question.answer];
    const isCorrect = selectedLetters.length === correctLetters.length && 
                     selectedLetters.every(letter => correctLetters.includes(letter));

    // Create feedback
    const newFeedback = {
      isCorrect,
      correctLetters,
      selectedLetters,
      explanation: question.explanation,
      countRight: score.correct + (isCorrect ? 1 : 0),
      countWrong: (score.total - score.correct) + (isCorrect ? 0 : 1),
      isComplete: progress.current >= progress.total,
      summary: {
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        percentage: Math.round(((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100)
      }
    };

    setFeedback(newFeedback);
    setShowExplanation(true);

    // Update demo session
    answerQuestion(question.id, selectedLetters, isCorrect);

    // Scroll to feedback section for better UX
    setTimeout(() => {
      const feedbackElement = document.querySelector('.feedback');
      if (feedbackElement) {
        feedbackElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleNext = () => {
    if (progress.current >= progress.total) {
      // Complete the session
      completeSession();
      navigate('/demo/app/dashboard');
    } else {
      nextQuestion();
    }
  };

  const getOptionClass = (letter: string) => {
    if (!feedback) {
      return selectedLetters.includes(letter) ? 'option selected' : 'option';
    }
    
    if (feedback.correctLetters.includes(letter)) {
      return 'option correct';
    }
    
    if (selectedLetters.includes(letter) && !feedback.correctLetters.includes(letter)) {
      return 'option incorrect';
    }
    
    return 'option';
  };

  return (
    <div className="quiz-card">
      {/* Demo Quiz Header */}
      <div className="quiz-header">
        <h3>Demo Quiz - Question {progress.current} of {progress.total}</h3>
        <div className="quiz-stats">
          <span className="stat-correct">Correct: {score.correct}</span>
          <span className="stat-wrong">Wrong: {score.total - score.correct}</span>
          <span>Progress: {progress.percentage}%</span>
        </div>
      </div>

      {/* Question Metadata */}
      <div className="question-meta">
        <span className="subdomain">{question.subDomain}</span>
        <span className="difficulty">Difficulty: {question.difficulty}</span>
        <span className="demo-badge">DEMO</span>
      </div>

      {/* Question Text */}
      <div className="question-text-container">
        <div className="question-text">
          {question.questionText}
        </div>
      </div>

      {/* Options */}
      <div className="options">
        {['A', 'B', 'C', 'D'].map((letter) => {
          const optionKey = `option${letter}` as keyof typeof question;
          const optionText = question[optionKey] as string;
          
          return (
            <div
              key={letter}
              className={getOptionClass(letter)}
              onClick={() => handleOptionSelect(letter)}
            >
              <span className="option-text">{optionText}</span>
            </div>
          );
        })}
      </div>

      {/* Actions - Moved right after options */}
      <div className="quiz-actions demo-quiz-actions">
        {!feedback ? (
          <button
            onClick={handleSubmit}
            disabled={selectedLetters.length === 0}
            className="btn-primary"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary"
          >
            {progress.current >= progress.total ? 'Complete Demo' : 'Next Question'}
          </button>
        )}
        
        <button
          onClick={() => navigate('/demo/app/dashboard')}
          className="btn-secondary"
        >
          Exit to Dashboard
        </button>
      </div>

      {/* Explanation and Progress - Clean layout without redundant feedback box */}
      {feedback && (
        <div className="feedback">
          {/* Explanation */}
          {showExplanation && (
            <div className="explanation-section">
              <button
                className="explanation-toggle"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                📖 Explanation
              </button>
              <div className="explanation">
                {question.explanation}
              </div>
            </div>
          )}

          {/* Progress Stats */}
          <div className="progress-stats">
            Score: {feedback.summary.correct}/{feedback.summary.total} ({feedback.summary.percentage}%)
          </div>
        </div>
      )}

      {/* Question Marking (Demo) */}
      <div className="question-marking">
        <span style={{ fontSize: '0.75rem', color: '#666', marginRight: '1rem' }}>
          Mark for review:
        </span>
        {['None', 'Review', 'Lab', 'Create More'].map((mark, index) => (
          <label key={mark} className="mark-option">
            <input
              type="radio"
              name="markType"
              value={index}
              checked={markType === index}
              onChange={() => setMarkType(index)}
            />
            <span>{mark}</span>
          </label>
        ))}
      </div>

      {/* Demo Completion Message */}
      {feedback && progress.current >= progress.total && (
        <div className="demo-completion-message">
          <h3>🎉 Demo Complete!</h3>
          <p>
            You've experienced the full quiz interface! In the real app, you'd have 
            hundreds more questions and detailed progress tracking across all certification domains.
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Sign Up for Full Access
          </button>
        </div>
      )}
    </div>
  );
}