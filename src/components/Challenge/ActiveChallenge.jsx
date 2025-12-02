import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './Challenge.css';

export default function ActiveChallenge({ challenge, currentUserId, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallengeData();
  }, [challenge]);

  const loadChallengeData = async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .limit(5);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      const { data: responsesData, error: responsesError } = await supabase
        .from('challenge_responses')
        .select('*')
        .eq('challenge_id', challenge.id);

      if (responsesError) throw responsesError;

      const userResponses = responsesData.filter((r) => r.user_id === currentUserId);
      const opponentResponses = responsesData.filter((r) => r.user_id !== currentUserId);

      setUserScore(userResponses.filter((r) => r.is_correct).length);
      setOpponentScore(opponentResponses.filter((r) => r.is_correct).length);

      if (userResponses.length >= 5) {
        setShowResult(true);
      } else {
        setCurrentQuestionIndex(userResponses.length);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading challenge data:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answerIndex) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correct_answer;

    try {
      const { error } = await supabase.from('challenge_responses').insert([
        {
          challenge_id: challenge.id,
          user_id: currentUserId,
          question_id: currentQuestion.id,
          selected_answer: answerIndex,
          is_correct: isCorrect,
        },
      ]);

      if (error) throw error;

      if (isCorrect) {
        setUserScore(userScore + 1);
      }
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      await finishChallenge();
    }
  };

  const finishChallenge = async () => {
    try {
      let winnerId = null;
      if (userScore > opponentScore) {
        winnerId = currentUserId;
      } else if (opponentScore > userScore) {
        winnerId = challenge.challenger_id === currentUserId
          ? challenge.opponent_id
          : challenge.challenger_id;
      }

      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          winner_id: winnerId,
        })
        .eq('id', challenge.id);

      if (error) throw error;

      setShowResult(true);
    } catch (error) {
      console.error('Error finishing challenge:', error);
    }
  };

  if (loading) {
    return (
      <div className="active-challenge">
        <div className="loading">Loading challenge...</div>
      </div>
    );
  }

  if (showResult) {
    const isWinner = userScore > opponentScore;
    const isDraw = userScore === opponentScore;

    return (
      <div className="active-challenge">
        <div className="challenge-result-card">
          <h1>Challenge Complete!</h1>
          <div className="result-comparison">
            <div className="score-column">
              <span className="score-label">Your Score</span>
              <span className={`score-value ${isWinner ? 'winner' : ''}`}>
                {userScore}
              </span>
            </div>
            <div className="score-divider">vs</div>
            <div className="score-column">
              <span className="score-label">Opponent Score</span>
              <span className={`score-value ${!isWinner && !isDraw ? 'winner' : ''}`}>
                {opponentScore}
              </span>
            </div>
          </div>
          <div className={`result-message ${isWinner ? 'win' : isDraw ? 'draw' : 'lose'}`}>
            {isWinner ? 'You Won!' : isDraw ? "It's a Draw!" : 'You Lost'}
          </div>
          <button onClick={onComplete} className="back-btn">
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = JSON.parse(currentQuestion.options);

  return (
    <div className="active-challenge">
      <div className="challenge-quiz-card">
        <div className="challenge-progress">
          <div className="progress-info">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>Score: {userScore}/{currentQuestionIndex}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="question-section">
          <h2>{currentQuestion.question}</h2>
          <div className="question-meta">
            <span className="difficulty-badge">{currentQuestion.difficulty}</span>
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
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Challenge'}
          </button>
        )}
      </div>
    </div>
  );
}
