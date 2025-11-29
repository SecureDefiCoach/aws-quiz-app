import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import QuizCard from './QuizCard';

interface Exam {
  number: string;
  name: string;
  display: string;
}

interface SubDomain {
  num: number;
  name: string;
}

function QuizBuilder() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subdomains, setSubdomains] = useState<SubDomain[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>(['NEW', 'WRONG']);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load exams on mount
  useEffect(() => {
    // Small delay to ensure Amplify is configured
    const timer = setTimeout(() => {
      loadExams();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load subdomains when exam changes
  useEffect(() => {
    if (selectedExam) {
      loadSubdomains(selectedExam);
    } else {
      setSubdomains([]);
      setSelectedSubdomain('');
    }
  }, [selectedExam]);

  // Update question count when filters change
  useEffect(() => {
    if (selectedExam && selectedStates.length > 0) {
      updateQuestionCount();
    } else {
      setQuestionCount(0);
    }
  }, [selectedExam, selectedSubdomain, selectedStates]);

  const loadExams = async () => {
    try {
      const client = generateClient<Schema>();
      const { data } = await client.queries.getExams();
      setExams(data || []);
    } catch (err) {
      console.error('Error loading exams:', err);
      setError('Failed to load exams');
    }
  };

  const loadSubdomains = async (examNumber: string) => {
    try {
      const client = generateClient<Schema>();
      const { data } = await client.queries.getSubDomains({ examNumber });
      setSubdomains(data || []);
    } catch (err) {
      console.error('Error loading subdomains:', err);
      setError('Failed to load subdomains');
    }
  };

  const updateQuestionCount = async () => {
    try {
      const client = generateClient<Schema>();
      const { data } = await client.queries.getQuestionCount({
        examNumber: selectedExam,
        subDomain: selectedSubdomain || undefined,
        states: selectedStates,
      });
      setQuestionCount(data || 0);
    } catch (err) {
      console.error('Error getting question count:', err);
    }
  };

  const handleStateToggle = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const handleStartQuiz = async () => {
    if (!selectedExam || selectedStates.length === 0) {
      setError('Please select an exam and at least one state');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = generateClient<Schema>();
      const examData = exams.find(e => e.number === selectedExam);
      const { data } = await client.queries.startQuiz({
        examNumber: selectedExam,
        examName: examData?.name || selectedExam,
        subDomain: selectedSubdomain || undefined,
        states: selectedStates,
        maxQuestions: maxQuestions || undefined,
      });

      if (data?.sessionId) {
        setSessionId(data.sessionId);
      } else {
        setError('Failed to start quiz');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = () => {
    setSessionId(null);
  };

  // If quiz is active, show QuizCard
  if (sessionId) {
    return <QuizCard sessionId={sessionId} onComplete={handleQuizComplete} />;
  }

  // Otherwise show quiz builder
  return (
    <div className="quiz-builder">
      <div className="card">
        <h2>Start a Quiz</h2>

        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label htmlFor="exam">Select Exam</label>
          <select
            id="exam"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="">-- Select an Exam --</option>
            {exams.map(exam => (
              <option key={exam.number} value={exam.number}>
                {exam.display}
              </option>
            ))}
          </select>
        </div>

        {selectedExam && (
          <div className="form-group">
            <label htmlFor="subdomain">Select Subdomain (Optional)</label>
            <select
              id="subdomain"
              value={selectedSubdomain}
              onChange={(e) => setSelectedSubdomain(e.target.value)}
            >
              <option value="">All Subdomains</option>
              {subdomains.map(sd => (
                <option key={sd.num} value={sd.num.toString()}>
                  {sd.num} - {sd.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Question States</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedStates.includes('NEW')}
                onChange={() => handleStateToggle('NEW')}
              />
              New
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedStates.includes('WRONG')}
                onChange={() => handleStateToggle('WRONG')}
              />
              Wrong
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedStates.includes('RIGHT')}
                onChange={() => handleStateToggle('RIGHT')}
              />
              Right
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maxQuestions">Max Questions (0 = all)</label>
          <input
            id="maxQuestions"
            type="number"
            min="0"
            value={maxQuestions}
            onChange={(e) => setMaxQuestions(parseInt(e.target.value) || 0)}
          />
        </div>

        {questionCount > 0 && (
          <div className="question-count">
            {questionCount} question{questionCount !== 1 ? 's' : ''} available
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleStartQuiz}
          disabled={loading || !selectedExam || selectedStates.length === 0 || questionCount === 0}
        >
          {loading ? 'Starting...' : 'Start Quiz'}
        </button>
      </div>
    </div>
  );
}

export default QuizBuilder;
