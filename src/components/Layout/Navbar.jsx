import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">Q</span>
          <span className="brand-text">QuizNews</span>
        </Link>

        <div className="navbar-menu">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            News
          </Link>
          <Link
            to="/quiz"
            className={`nav-link ${isActive('/quiz') ? 'active' : ''}`}
          >
            Quiz
          </Link>
          <Link
            to="/challenge"
            className={`nav-link ${isActive('/challenge') ? 'active' : ''}`}
          >
            Challenge
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar-small">
              {profile?.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details-nav">
              <span className="username">{profile?.username}</span>
              <span className="points">{profile?.points} pts</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
