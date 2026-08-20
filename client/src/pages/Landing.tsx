import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import './Landing.css';

const FEATURES = [
  {
    label: 'Course creation',
    title: 'Build courses instructors are proud of',
    desc: 'Structure lessons, embed video, and organize modules with a clean, focused editor.',
  },
  {
    label: 'AI quiz generation',
    title: 'Turn any lesson into a quiz in seconds',
    desc: 'Paste your lesson content and let the AI draft questions instructors can edit and approve.',
  },
  {
    label: 'Study assistant',
    title: 'A tutor that knows the course',
    desc: 'Students get instant, scoped answers grounded in the actual lesson material — never generic.',
  },
  {
    label: 'Progress tracking',
    title: 'Certificates that mean something',
    desc: 'Automatic progress tracking and a certificate issued the moment a course is truly complete.',
  },
];

const Landing = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const goToDashboard = () => {
    if (!user) return;
    if (user.role === 'ADMIN') navigate('/admin');
    else if (user.role === 'INSTRUCTOR') navigate('/instructor');
    else navigate('/student');
  };

  return (
    <div className="landing">
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />
      <svg className="constellation" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <line x1={120} y1={140} x2={320} y2={90} />
        <line x1={320} y1={90} x2={540} y2={180} />
        <line x1={540} y1={180} x2={780} y2={110} />
        <line x1={320} y1={90} x2={420} y2={260} />
        <line x1={780} y1={110} x2={900} y2={230} />
        <circle cx={120} cy={140} r={3} />
        <circle cx={320} cy={90} r={4} />
        <circle cx={540} cy={180} r={3} />
        <circle cx={780} cy={110} r={4} />
        <circle cx={420} cy={260} r={3} />
        <circle cx={900} cy={230} r={3} />
      </svg>

      <nav className="landing-nav">
        <span className="brand">Lumen<em>Learner</em></span>
        {user ? (
          <div className="nav-actions">
            <span className="nav-user">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn-ghost" onClick={goToDashboard}>Dashboard</button>
            <button className="btn-ghost" onClick={logout}>Log out</button>
          </div>
        ) : (
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => setModalOpen(true)}>Sign in</button>
            <button className="btn-solid" onClick={() => setModalOpen(true)}>Get started</button>
          </div>
        )}
      </nav>

      <header className="hero">
        <p className="eyebrow">AI-powered learning management</p>
        <h1 className="hero-title">
          Learning,<br /><span className="italic">illuminated.</span>
        </h1>
        <p className="hero-sub">
          Build courses, generate quizzes instantly, and give every student
          an AI study partner grounded in your material — not the open internet.
        </p>
        {!user && (
          <div className="hero-actions">
            <button className="btn-solid large" onClick={() => setModalOpen(true)}>
              Start learning free
            </button>
            <button className="btn-outline large" onClick={() => setModalOpen(true)}>
              I'm an instructor
            </button>
          </div>
        )}
      </header>

      <section className="features">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.label}>
            <span className="feature-label">{f.label}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default Landing;