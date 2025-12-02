import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Layout from './components/Layout/Layout';
import NewsFeed from './components/News/NewsFeed';
import Quiz from './components/Quiz/Quiz';
import Challenge from './components/Challenge/Challenge';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return user ? <Navigate to="/" /> : children;
}

function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute>
                {isLogin ? (
                  <Login onToggle={() => setIsLogin(false)} />
                ) : (
                  <Register onToggle={() => setIsLogin(true)} />
                )}
              </AuthRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<NewsFeed />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="challenge" element={<Challenge />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
