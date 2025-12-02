import { useState } from 'react';
import './Challenge.css';

export default function ChallengeList({
  users,
  challenges,
  currentUserId,
  onCreateChallenge,
  onStartChallenge,
}) {
  const [activeTab, setActiveTab] = useState('users');

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'status-pending' },
      in_progress: { text: 'In Progress', class: 'status-progress' },
      completed: { text: 'Completed', class: 'status-completed' },
    };
    return badges[status] || badges.pending;
  };

  const canStartChallenge = (challenge) => {
    return challenge.status === 'pending' && challenge.opponent_id === currentUserId;
  };

  const isChallenger = (challenge) => {
    return challenge.challenger_id === currentUserId;
  };

  return (
    <div className="challenge-list">
      <div className="challenge-header">
        <h1>Quiz Challenges</h1>
        <p>Challenge other users and compete for points</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Find Users
        </button>
        <button
          className={`tab ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          My Challenges ({challenges.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="users-grid">
          {users.length === 0 ? (
            <div className="empty-state">No users available to challenge</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <h3>{user.username}</h3>
                    <p className="user-points">{user.points} points</p>
                  </div>
                </div>
                <button
                  onClick={() => onCreateChallenge(user.id)}
                  className="challenge-btn"
                >
                  Challenge
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="challenges-list">
          {challenges.length === 0 ? (
            <div className="empty-state">No challenges yet. Start by challenging someone!</div>
          ) : (
            challenges.map((challenge) => {
              const badge = getStatusBadge(challenge.status);
              const opponent = isChallenger(challenge)
                ? challenge.opponent
                : challenge.challenger;

              return (
                <div key={challenge.id} className="challenge-item">
                  <div className="challenge-info">
                    <div className="challenge-opponent">
                      <div className="opponent-avatar">
                        {opponent.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="opponent-details">
                        <h3>
                          {isChallenger(challenge) ? 'vs ' : 'from '}
                          {opponent.username}
                        </h3>
                        <p className="challenge-date">
                          {new Date(challenge.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`status-badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>

                  {challenge.status === 'completed' && challenge.winner && (
                    <div className="challenge-result">
                      {challenge.winner_id === currentUserId ? (
                        <span className="result-win">You Won!</span>
                      ) : (
                        <span className="result-lose">You Lost</span>
                      )}
                    </div>
                  )}

                  {canStartChallenge(challenge) && (
                    <button
                      onClick={() => onStartChallenge(challenge)}
                      className="start-btn"
                    >
                      Start Challenge
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
