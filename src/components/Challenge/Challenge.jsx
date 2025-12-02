import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ChallengeList from './ChallengeList';
import ActiveChallenge from './ActiveChallenge';
import './Challenge.css';

export default function Challenge() {
  const [view, setView] = useState('list');
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      loadUsers();
      loadChallenges();
    }
  }, [profile]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .order('points', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:challenger_id(username, points),
          opponent:opponent_id(username, points),
          winner:winner_id(username)
        `)
        .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const createChallenge = async (opponentId) => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert([
          {
            challenger_id: profile.id,
            opponent_id: opponentId,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setActiveChallenge(data);
      setView('active');
      loadChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    }
  };

  const startChallenge = (challenge) => {
    setActiveChallenge(challenge);
    setView('active');
  };

  const handleChallengeComplete = () => {
    setView('list');
    setActiveChallenge(null);
    loadChallenges();
  };

  if (loading) {
    return (
      <div className="challenge-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="challenge-container">
      {view === 'list' ? (
        <ChallengeList
          users={users}
          challenges={challenges}
          currentUserId={profile.id}
          onCreateChallenge={createChallenge}
          onStartChallenge={startChallenge}
        />
      ) : (
        <ActiveChallenge
          challenge={activeChallenge}
          currentUserId={profile.id}
          onComplete={handleChallengeComplete}
        />
      )}
    </div>
  );
}
