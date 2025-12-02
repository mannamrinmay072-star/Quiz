import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './Quiz.css';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .limit(5);

      if (error) throw error;
      setQuestions(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnsweredQuestions([
      ...answeredQuestions,
      {
        question: currentQuestion.question,
        selected: answerIndex,
        correct: currentQuestion.correct_answer,
        isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
      updateUserPoints();
    }
  };

  const updateUserPoints = async () => {
    if (!profile) return;

    try {
      const pointsEarned = score * 10;
      const { error } = await supabase
        .from('profiles')
        .update({ points: profile.points + pointsEarned })
        .eq('id', profile.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions([]);
    loadQuestions();
  };

  if (loading) {
    return <div className="quiz-container"><div className="loading">Loading questions...</div></div>;
  }

  if (questions.length === 0) {
    return <div className="quiz-container"><div className="loading">No questions available</div></div>;
  }

  if (showResult) {
    return (
      <div className="quiz-container">
        <div className="quiz-result">
          <div className="result-header">
            <h1>Quiz Completed!</h1>
            <div className="result-score">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {questions.length}</span>
            </div>
            <p className="result-message">
              {score === questions.length
                ? 'Perfect score! Outstanding!'
                : score >= questions.length * 0.7
                ? 'Great job! Well done!'
                : score >= questions.length * 0.5
                ? 'Good effort! Keep practicing!'
                : 'Keep learning and try again!'}
            </p>
            <p className="points-earned">+{score * 10} points earned</p>
          </div>

          <div className="result-details">
            <h3>Review Your Answers</h3>
            {answeredQuestions.map((answer, index) => (
              <div
                key={index}
                className={`answer-review ${answer.isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="review-header">
                  <span className="review-number">Question {index + 1}</span>
                  <span className={`review-badge ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="review-question">{answer.question}</p>
              </div>
            ))}
          </div>

          <button onClick={restartQuiz} className="restart-btn">
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = JSON?.parse(currentQuestion?.options);

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="question-section">
          <h2>{currentQuestion.question}</h2>
          <div className="question-meta">
            <span className="difficulty-badge">{currentQuestion.difficulty}</span>
            <span className="category-badge">{currentQuestion.category}</span>
          </div>
        </div>

        <div className="answers-section">
          {options.map((option, index) => (
            <button
              key={index}
              className={`answer-option ${
                selectedAnswer === index
                  ? index === currentQuestion.correct_answer
                    ? 'correct'
                    : 'incorrect'
                  : ''
              } ${
                selectedAnswer !== null && index === currentQuestion.correct_answer
                  ? 'correct'
                  : ''
              }`}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        {selectedAnswer !== null && (
          <button onClick={handleNext} className="next-btn">
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
