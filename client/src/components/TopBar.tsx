import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

const TopBar = ({ onLogoClick }: { onLogoClick?: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const goHome = () => {
    if (onLogoClick) return onLogoClick();
    navigate('/');
  };

  const goToDashboard = () => {
    if (!user) return;
    if (user.role === 'ADMIN') navigate('/admin');
    else if (user.role === 'INSTRUCTOR') navigate('/instructor');
    else navigate('/student');
  };

  return (
    <div className="top-bar">
      <a className="brand" onClick={goHome} style={{ cursor: 'pointer' }}>
        Lumen<em>Learner</em>
      </a>
      <div className="top-bar-actions">
        {user && <NotificationBell />}
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user && (
          <>
            <span className="top-bar-user">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn-ghost" onClick={goToDashboard}>Dashboard</button>
            <button className="btn-ghost" onClick={logout}>Log out</button>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;