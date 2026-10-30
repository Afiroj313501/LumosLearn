import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { Role } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { getAllCourses } from '../api/courses';
import type { Course } from '../api/courses';
import './Landing.css';

// Rich fallback courses for instant showcase if server courses are empty or offline
const SHOWCASE_COURSES = [
  {
    id: 'showcase-1',
    title: 'Foundations of Modern Distributed Systems',
    description: 'Master consensus algorithms, Paxos, Raft, vector clocks, and high-availability architecture with interactive labs.',
    category: 'Computer Science',
    instructor: { name: 'Dr. Aris Thorne' },
    avgRating: 4.9,
    reviewCount: 84,
    _count: { lessons: 14, enrollments: 342 },
    badge: 'Popular',
  },
  {
    id: 'showcase-2',
    title: 'Applied Machine Learning with Gemini & LLMs',
    description: 'Build enterprise-grade AI agents, retrieval-augmented systems (RAG), and multimodal pipelines from scratch.',
    category: 'Artificial Intelligence',
    instructor: { name: 'Elena Rostova' },
    avgRating: 5.0,
    reviewCount: 112,
    _count: { lessons: 18, enrollments: 520 },
    badge: 'Trending',
  },
  {
    id: 'showcase-3',
    title: 'Design Systems & Modern Micro-Interactions',
    description: 'Create scalable token architectures, accessible component libraries, and buttery-smooth web animations.',
    category: 'Design & UX',
    instructor: { name: 'Marcus Sterling' },
    avgRating: 4.8,
    reviewCount: 67,
    _count: { lessons: 10, enrollments: 215 },
    badge: 'Featured',
  },
];

const TUTOR_PROMPTS = [
  {
    query: 'Summarize the Raft consensus algorithm in 3 key points.',
    source: 'Lecture 04: Distributed Consensus (Slides 12-16)',
    response:
      'Based on your Course Lecture 04 slides:\n1. **Leader Election:** Raft uses randomized election timeouts to elect a single leader among follower nodes.\n2. **Log Replication:** Only the leader accepts client commands, appends them to its log, and replicates them to follower peers.\n3. **Safety Invariant:** A leader never overwrites or truncates its own log entries; it only appends, guaranteeing linearizability across cluster quorums.',
  },
  {
    query: 'What is the penalty if I disconnect during a timed quiz?',
    source: 'Course Syllabus & Exam Rules (Section 3.2)',
    response:
      'According to Section 3.2 of the syllabus:\nLeaving or closing the browser window mid-quiz forfeits the current attempt. The quiz auto-grades only the responses submitted up to that exact timestamp, and instructors do not reopen single-attempt assessments without prior dean authorization.',
  },
  {
    query: 'Can you generate a quick practice question on Vector Clocks?',
    source: 'Lesson 06 Notes: Causality & Partial Ordering',
    response:
      'Here is a practice question generated directly from Lesson 06:\n\n**Question:** If process P1 sends a message with vector [2, 0, 1] to process P2 whose current vector is [1, 2, 0], what will be P2\'s vector clock immediately upon receiving and processing the message?\n\n**Answer:** `[2, 3, 1]` (P2 takes the component-wise maximum [max(2,1), max(0,2), max(1,0)] = [2,2,1], then increments its own index #2 to reach [2,3,1]).',
  },
];

const FAQS = [
  {
    q: 'How does LumenLearner prevent AI hallucinations?',
    a: 'Unlike generic chatbots, LumenLearner’s Gemini assistant operates strictly within the bounded context of your uploaded course files, PDF lecture slides, and notes (extracted via officeparser). If an answer is not corroborated by the instructor’s curriculum, the assistant explicitly states that it is not covered in the course material.',
  },
  {
    q: 'Can instructors edit AI-generated quizzes before students see them?',
    a: 'Absolutely. When an instructor uploads lesson notes or slides, the AI drafts multiple-choice questions with answer keys and rationale. Instructors review, tweak options, reallocate marks, or re-roll questions in a dedicated inline editor before publishing.',
  },
  {
    q: 'How do verifiable certificates work?',
    a: 'Certificates are generated as tamper-evident PDF documents containing unique cryptographic verification IDs. Issuance is mathematically gated: it requires the instructor to mark all lessons finalized and the student to achieve 100% genuine completion across all lessons, assignments, and quizzes.',
  },
  {
    q: 'What formats can instructors upload for course materials?',
    a: 'LumenLearner supports rich markdown text, embedded YouTube video lessons, and downloadable attachments including PDF, PPT/PPTX, DOC/DOCX, images, and ZIP files.',
  },
  {
    q: 'Is LumenLearner free to use?',
    a: 'Yes! Students can sign up and enroll in open courses immediately. Instructors can register and submit course proposals, which pass through a one-time administrator approval to maintain institutional quality.',
  },
];

const Landing = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  const [modalRole, setModalRole] = useState<Role>('STUDENT');

  const [activeDemoTab, setActiveDemoTab] = useState<'tutor' | 'quiz' | 'certificate'>('tutor');
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [activeRoleTab, setActiveRoleTab] = useState<'students' | 'instructors'>('students');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getAllCourses()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCourses(res.data.slice(0, 3));
        }
      })
      .catch(() => {
        // Fallback gracefully to SHOWCASE_COURSES
      });
  }, []);

  const openAuth = (mode: 'login' | 'register', role: Role = 'STUDENT') => {
    setModalMode(mode);
    setModalRole(role);
    setModalOpen(true);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'INSTRUCTOR') return '/instructor';
    return '/student';
  };

  const displayCourses = courses.length > 0 ? courses : SHOWCASE_COURSES;

  return (
    <div className="landing-root">
      {/* Ambient background glows */}
      <div className="glow-orb orb-gold" />
      <div className="glow-orb orb-violet" />
      <div className="glow-orb orb-cyan" />

      {/* Constellation celestial grid */}
      <svg className="constellation-svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <line x1={180} y1={120} x2={440} y2={90} />
        <line x1={440} y1={90} x2={720} y2={180} />
        <line x1={720} y1={180} x2={1080} y2={110} />
        <line x1={1080} y1={110} x2={1320} y2={240} />
        <line x1={440} y1={90} x2={560} y2={320} />
        <line x1={720} y1={180} x2={860} y2={390} />
        <line x1={860} y1={390} x2={1180} y2={420} />

        <circle cx={180} cy={120} r={3.5} className="star-pulse-1" />
        <circle cx={440} cy={90} r={4.5} className="star-pulse-2" />
        <circle cx={720} cy={180} r={3.5} className="star-pulse-3" />
        <circle cx={1080} cy={110} r={4.5} className="star-pulse-1" />
        <circle cx={1320} cy={240} r={3.5} className="star-pulse-2" />
        <circle cx={560} cy={320} r={3} className="star-pulse-3" />
        <circle cx={860} cy={390} r={4} className="star-pulse-1" />
        <circle cx={1180} cy={420} r={3.5} className="star-pulse-2" />
      </svg>

      {/* Sticky frosted navigation bar */}
      <header className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#" className="nav-brand">
            <span className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                  fill="url(#brandGrad)"
                />
                <defs>
                  <linearGradient id="brandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f2b84b" />
                    <stop offset="1" stopColor="#8c7cf0" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="brand-text">
              Lumen<em>Learner</em>
            </span>
          </a>

          <nav className="nav-links">
            <a href="#demo">Live Demo</a>
            <a href="#features">Features</a>
            <a href="#roles">Experience</a>
            <a href="#courses">Courses</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav-actions">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {user ? (
              <div className="user-nav-box">
                <span className="user-greeting">
                  Hi, <strong>{user.name}</strong> ({user.role.toLowerCase()})
                </span>
                <button className="btn-solid" onClick={() => navigate(getDashboardPath())}>
                  Go to Dashboard →
                </button>
              </div>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => openAuth('login')}>
                  Sign in
                </button>
                <button className="btn-solid" onClick={() => openAuth('register', 'STUDENT')}>
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <span className="pill-dot" />
            <span>Powered by Google Gemini · Grounded LMS Intelligence</span>
          </div>

          <h1 className="hero-heading">
            Learning, <br />
            <span className="text-shimmer">illuminated</span> by clarity.
          </h1>

          <p className="hero-description">
            The intelligent learning management ecosystem uniting educators and ambitious students.
            Turn lecture slides into interactive quizzes in seconds, and give every student a 24/7 AI tutor
            strictly grounded in course documents.
          </p>

          {!user ? (
            <div className="hero-cta-group">
              <button
                className="btn-solid btn-hero-primary"
                onClick={() => openAuth('register', 'STUDENT')}
              >
                <span>Start Learning Free</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button
                className="btn-outline btn-hero-secondary"
                onClick={() => openAuth('register', 'INSTRUCTOR')}
              >
                <span>Teach as Instructor</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="hero-cta-group">
              <button className="btn-solid btn-hero-primary" onClick={() => navigate(getDashboardPath())}>
                Enter Your {user.role === 'INSTRUCTOR' ? 'Instructor' : user.role === 'ADMIN' ? 'Admin' : 'Student'} Hub →
              </button>
            </div>
          )}

          {/* Metric highlights */}
          <div className="hero-metrics-strip">
            <div className="metric-item">
              <div className="metric-val">100%</div>
              <div className="metric-lbl">Grounded AI Accuracy</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-val">3.4×</div>
              <div className="metric-lbl">Faster Lesson Prep</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-val">0</div>
              <div className="metric-lbl">Generic Hallucinations</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-val">Instant</div>
              <div className="metric-lbl">PDF & Slides Extraction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Showcase Simulator */}
      <section id="demo" className="section-container demo-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">Interactive Studio Preview</span>
          <h2 className="section-title">See the intelligence in action.</h2>
          <p className="section-subtitle">
            Experience how LumenLearner transforms raw lecture materials into structured mastery.
          </p>
        </div>

        <div className="demo-window-card">
          {/* Mock window chrome */}
          <div className="demo-window-bar">
            <div className="window-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <div className="window-title-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>lumenlearner.internal · course-environment</span>
            </div>
            <div className="window-badge">Live Simulation</div>
          </div>

          {/* Demo tab controls */}
          <div className="demo-tab-switcher">
            <button
              className={`demo-tab-btn ${activeDemoTab === 'tutor' ? 'active' : ''}`}
              onClick={() => setActiveDemoTab('tutor')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>1. Course-Grounded AI Study Partner</span>
            </button>
            <button
              className={`demo-tab-btn ${activeDemoTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveDemoTab('quiz')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>2. 1-Click Quiz Extraction</span>
            </button>
            <button
              className={`demo-tab-btn ${activeDemoTab === 'certificate' ? 'active' : ''}`}
              onClick={() => setActiveDemoTab('certificate')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
              <span>3. Verified PDF Credentials</span>
            </button>
          </div>

          {/* Demo Tab 1: AI Study Partner */}
          {activeDemoTab === 'tutor' && (
            <div className="demo-body demo-tutor-body">
              <div className="tutor-sidebar">
                <div className="tutor-context-header">
                  <span className="course-chip">CS 301</span>
                  <h4>Distributed Consensus</h4>
                  <p>Scope: 14 lessons, 3 PDFs, 2 Slide Decks</p>
                </div>

                <div className="prompt-selector-label">Test a student question:</div>
                <div className="prompt-pills">
                  {TUTOR_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      className={`prompt-pill-btn ${selectedPromptIdx === idx ? 'active' : ''}`}
                      onClick={() => setSelectedPromptIdx(idx)}
                    >
                      <span className="pill-index">Q{idx + 1}</span>
                      <span className="pill-text">{item.query}</span>
                    </button>
                  ))}
                </div>

                <div className="tutor-guardrail-notice">
                  <span className="guardrail-icon">🔒</span>
                  <span>Grounded strictly in course texts. Zero hallucinatory external search.</span>
                </div>
              </div>

              <div className="tutor-chat-screen">
                <div className="chat-bubble student-bubble">
                  <div className="bubble-author">Student Question</div>
                  <div className="bubble-text">{TUTOR_PROMPTS[selectedPromptIdx].query}</div>
                </div>

                <div className="chat-bubble ai-bubble">
                  <div className="ai-author-row">
                    <span className="ai-avatar">✨</span>
                    <span className="ai-name">Lumen Study Assistant</span>
                    <span className="citation-tag">
                      Source: {TUTOR_PROMPTS[selectedPromptIdx].source}
                    </span>
                  </div>
                  <div className="bubble-text markdown-render">
                    {TUTOR_PROMPTS[selectedPromptIdx].response.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demo Tab 2: Quiz Generation */}
          {activeDemoTab === 'quiz' && (
            <div className="demo-body demo-quiz-body">
              <div className="quiz-generator-header">
                <div className="file-analyzed-badge">
                  <span className="file-icon">📄</span>
                  <div>
                    <strong>Lecture_07_Neural_Networks.pdf</strong> (Extracted via officeparser)
                  </div>
                </div>
                <div className="generator-status">
                  <span className="status-indicator" />
                  <span>5 Auto-Generated Questions Verified by Instructor</span>
                </div>
              </div>

              <div className="quiz-interactive-card">
                <div className="question-header">
                  <span className="q-number">Question 2 of 5</span>
                  <span className="q-marks">2.0 Marks</span>
                </div>

                <h3 className="quiz-question-text">
                  Why does the vanishing gradient problem predominantly occur when using traditional Sigmoid activation functions in deep architectures?
                </h3>

                <div className="quiz-options-list">
                  {[
                    { id: 0, text: 'Sigmoid derivatives peak at 0.25, causing multiplicative decay across consecutive backpropagation layers.', correct: true },
                    { id: 1, text: 'Sigmoid outputs unbound negative values, which triggers floating-point underflow.', correct: false },
                    { id: 2, text: 'The function cannot be differentiated anywhere on the domain [-∞, +∞].', correct: false },
                    { id: 3, text: 'Sigmoid automatically zeroes out weights with negative gradients.', correct: false },
                  ].map((opt) => {
                    let optionClass = 'quiz-option-btn';
                    if (quizSubmitted) {
                      if (opt.correct) optionClass += ' correct';
                      else if (quizSelectedOption === opt.id) optionClass += ' wrong';
                    } else if (quizSelectedOption === opt.id) {
                      optionClass += ' selected';
                    }

                    return (
                      <button
                        key={opt.id}
                        className={optionClass}
                        onClick={() => {
                          if (!quizSubmitted) setQuizSelectedOption(opt.id);
                        }}
                      >
                        <span className="opt-radio">
                          {quizSelectedOption === opt.id ? '●' : '○'}
                        </span>
                        <span className="opt-text">{opt.text}</span>
                        {quizSubmitted && opt.correct && <span className="opt-badge">✓ Correct</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-footer-actions">
                  {!quizSubmitted ? (
                    <button
                      className="btn-solid"
                      disabled={quizSelectedOption === null}
                      onClick={() => setQuizSubmitted(true)}
                    >
                      Check My Answer
                    </button>
                  ) : (
                    <div className="quiz-feedback-box">
                      <div className="feedback-text">
                        {quizSelectedOption === 0 ? (
                          <span className="success-text">🎉 Spot on! The maximum derivative of Sigmoid is 0.25. Multiplying numbers &lt; 1 across deep networks diminishes the gradient to near zero.</span>
                        ) : (
                          <span className="error-text">Option A is the correct answer. The derivative of σ(x) has a maximum value of 0.25.</span>
                        )}
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizSelectedOption(null);
                        }}
                      >
                        Reset Demo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Demo Tab 3: Certificate Preview */}
          {activeDemoTab === 'certificate' && (
            <div className="demo-body demo-cert-body">
              <div className="cert-preview-card">
                <div className="cert-border">
                  <div className="cert-watermark">LUMEN</div>
                  <div className="cert-header">
                    <span className="cert-brand">LumenLearner Academy</span>
                    <span className="cert-tag">Certificate of Academic Completion</span>
                  </div>

                  <p className="cert-lead">This is proudly conferred upon</p>
                  <h3 className="cert-student-name">Alexandria Morgan</h3>
                  <p className="cert-desc">
                    for successfully demonstrating 100% mastery, quizzes, and verified assignments in
                  </p>
                  <div className="cert-course-title">Distributed Systems & Algorithmic Consensus</div>

                  <div className="cert-meta-row">
                    <div className="cert-meta-item">
                      <span className="meta-lbl">Credential ID</span>
                      <span className="meta-val">LL-9824-A19F</span>
                    </div>
                    <div className="cert-meta-item">
                      <span className="meta-lbl">Instructor</span>
                      <span className="meta-val">Dr. Aris Thorne</span>
                    </div>
                    <div className="cert-meta-item">
                      <span className="meta-lbl">Verification</span>
                      <span className="meta-val text-success">Verified & Finalized ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="section-container">
        <div className="section-header text-center">
          <span className="section-eyebrow">Platform Capabilities</span>
          <h2 className="section-title">Engineered for depth, speed, and mastery.</h2>
          <p className="section-subtitle">
            Every feature in LumenLearner is purposefully designed to eliminate busywork for educators
            and illuminate pathways for learners.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="feature-kicker">Grounded AI</span>
            <h3>Course-Scoped Study Assistant</h3>
            <p>
              Students get immediate, contextual clarity grounded strictly in lesson text, PDFs, and slide decks.
              No off-topic tangents, no internet hallucinations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="feature-kicker">Automated Creation</span>
            <h3>1-Click Quiz & Summary Studio</h3>
            <p>
              Upload PDF, PPTX, or DOCX lecture files. Gemini automatically drafts thorough multiple-choice
              assessments with explanations ready for instructor approval.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span className="feature-kicker">Rich Content</span>
            <h3>Modular Multi-Media Delivery</h3>
            <p>
              Deliver structured modules featuring rich text, embedded YouTube streaming, downloadable source code,
              and optional enrollment password barriers.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
            <span className="feature-kicker">Credentials</span>
            <h3>Tamper-Proof PDF Certificates</h3>
            <p>
              Auto-generated PDF certificates with cryptographic IDs, safely protected behind instructor content
              finalization to prevent illegitimate issuance.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <span className="feature-kicker">Analytics</span>
            <h3>Instructor Insights & CSV Export</h3>
            <p>
              Monitor enrollment velocity, average progress, submission status, and quiz distributions.
              Export complete course grade books with a single click.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="feature-kicker">Governance</span>
            <h3>Role-Based Workflows & Approvals</h3>
            <p>
              Multi-tier permissions for Admins, Instructors, and Students. Instructor signup approvals ensure
              high curriculum standards across the platform.
            </p>
          </div>
        </div>
      </section>

      {/* Dual Audience Section: Students vs Instructors */}
      <section id="roles" className="section-container roles-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">Tailored Experiences</span>
          <h2 className="section-title">Built with empathy for both sides of the classroom.</h2>
        </div>

        <div className="role-switch-container">
          <div className="role-toggle-bar">
            <button
              className={`role-toggle-tab ${activeRoleTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveRoleTab('students')}
            >
              🎓 For Ambitious Students
            </button>
            <button
              className={`role-toggle-tab ${activeRoleTab === 'instructors' ? 'active' : ''}`}
              onClick={() => setActiveRoleTab('instructors')}
            >
              🧑‍🏫 For Visionary Instructors
            </button>
          </div>

          {activeRoleTab === 'students' ? (
            <div className="role-showcase-panel">
              <div className="role-info">
                <h3>Learn faster without getting stuck.</h3>
                <p>
                  No more waiting days for office hours. Lumen gives you a personalized study copilot
                  that explains tricky formulas, summarizes long readings, and tests your recall.
                </p>
                <ul className="role-bullet-list">
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Scoped 24/7 Q&A:</strong> Ask questions and get cited answers from your instructor's lecture slides.</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Instant Feedback Quizzes:</strong> Confirm-to-start gates with clear rationale on why an answer was right or wrong.</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Automated Certificates:</strong> Earn verifiable, printable PDF certificates upon course mastery.</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Personalized AI Recommendations:</strong> Smart course discovery based on your current enrollment history.</span>
                  </li>
                </ul>
                <button className="btn-solid" onClick={() => openAuth('register', 'STUDENT')}>
                  Join as a Student →
                </button>
              </div>

              <div className="role-visual">
                <div className="mock-card">
                  <div className="mock-card-header">
                    <span className="badge-pill">Student Progress</span>
                    <span className="badge-pct">82% Completed</span>
                  </div>
                  <div className="mock-progress-track">
                    <div className="mock-progress-bar" style={{ width: '82%' }} />
                  </div>
                  <div className="mock-list">
                    <div className="mock-item done">
                      <span>✓ Lesson 01: Vector Clocks & Partial Ordering</span>
                      <span className="item-tag">Completed</span>
                    </div>
                    <div className="mock-item done">
                      <span>✓ Lesson 02: Paxos State Machine Replication</span>
                      <span className="item-tag">Completed</span>
                    </div>
                    <div className="mock-item active">
                      <span>▶ Lesson 03: Raft Heartbeats & Split Brains</span>
                      <span className="item-tag current">In Progress</span>
                    </div>
                    <div className="mock-item pending">
                      <span>🔒 Final Assessment & Cryptographic Certificate</span>
                      <span className="item-tag">Locked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="role-showcase-panel">
              <div className="role-info">
                <h3>Build courses you’re genuinely proud of.</h3>
                <p>
                  Focus on teaching, not tedious question drafting and grading logistics. LumenLearner’s
                  AI handles question generation, document text parsing, and grade distribution.
                </p>
                <ul className="role-bullet-list">
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>AI Course Outline Generator:</strong> Enter any subject and generate a complete modular syllabus structure.</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Slide-to-Quiz Automation:</strong> Extract multi-choice questions from lecture PDFs & PPTs in 5 seconds.</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Cohort Security:</strong> Restrict course enrollments with optional instructor passcodes.</span>
                  </li>
                  <li>
                    <span className="check-bullet">✓</span>
                    <span><strong>Gradebook CSV Export:</strong> Download all student scores, assignment submissions, and quiz metrics instantly.</span>
                  </li>
                </ul>
                <button className="btn-solid" onClick={() => openAuth('register', 'INSTRUCTOR')}>
                  Apply to Teach with Lumen →
                </button>
              </div>

              <div className="role-visual">
                <div className="mock-card">
                  <div className="mock-card-header">
                    <span className="badge-pill">Instructor Command Center</span>
                    <span className="badge-pct">Active Cohort</span>
                  </div>
                  <div className="mock-analytics-stat-row">
                    <div className="stat-mini-box">
                      <div className="stat-mini-val">520</div>
                      <div className="stat-mini-lbl">Active Students</div>
                    </div>
                    <div className="stat-mini-box">
                      <div className="stat-mini-val">91.4%</div>
                      <div className="stat-mini-lbl">Quiz Avg</div>
                    </div>
                    <div className="stat-mini-box">
                      <div className="stat-mini-val">4.9 ★</div>
                      <div className="stat-mini-lbl">Course Rating</div>
                    </div>
                  </div>
                  <div className="mock-list">
                    <div className="mock-item action-ready">
                      <span>⚡ 4 New Assignment Submissions Ready for Review</span>
                      <button className="btn-tiny">Grade</button>
                    </div>
                    <div className="mock-item action-ready">
                      <span>📊 Export Gradebook (CSV)</span>
                      <button className="btn-tiny">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses Showcase */}
      <section id="courses" className="section-container">
        <div className="section-header text-center">
          <span className="section-eyebrow">Explore the Catalog</span>
          <h2 className="section-title">Courses crafted for real-world impact.</h2>
          <p className="section-subtitle">
            Browse our top-rated offerings or sign in to enroll in private cohort sessions.
          </p>
        </div>

        <div className="courses-grid">
          {displayCourses.map((c: any) => (
            <div className="course-landing-card" key={c.id}>
              <div className="course-card-top">
                <span className="course-cat-tag">{c.category || 'Curriculum'}</span>
                {c.badge && <span className="course-badge-pill">{c.badge}</span>}
              </div>

              <h3 className="course-card-title">{c.title}</h3>
              <p className="course-card-desc">{c.description}</p>

              <div className="course-meta-details">
                <div className="instructor-detail">
                  <span className="inst-avatar">👤</span>
                  <span className="inst-name">{c.instructor?.name || 'Verified Faculty'}</span>
                </div>

                <div className="course-stats-line">
                  <span className="rating-pill">
                    ★ {c.avgRating ? Number(c.avgRating).toFixed(1) : '4.9'}
                    {c.reviewCount ? ` (${c.reviewCount})` : ''}
                  </span>
                  <span className="lessons-pill">
                    {c._count?.lessons || 12} lessons
                  </span>
                </div>
              </div>

              <div className="course-card-footer">
                <button
                  className="btn-outline full-width"
                  onClick={() => openAuth('register', 'STUDENT')}
                >
                  Enroll Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials & Social Proof */}
      <section className="section-container testimonials-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">Endorsements</span>
          <h2 className="section-title">Loved by learners, trusted by educators.</h2>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-rating">★★★★★</div>
            <blockquote className="testimonial-quote">
              “The grounded AI study assistant is an absolute game-changer. My students no longer get stuck on midnight problem sets, and my quiz prep time dropped by 70%.”
            </blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">DV</div>
              <div className="author-info">
                <strong>Dr. Elena Vance</strong>
                <span>Professor of Distributed Computing</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-rating">★★★★★</div>
            <blockquote className="testimonial-quote">
              “Finally, an LMS where the AI doesn't hallucinate answers from Reddit. It quotes the exact slides and timestamps from our professor's uploaded lecture deck.”
            </blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">MC</div>
              <div className="author-info">
                <strong>Marcus Chen</strong>
                <span>Software Engineering Student</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-rating">★★★★★</div>
            <blockquote className="testimonial-quote">
              “Issuing tamper-proof PDF certificates automatically when students finish verified coursework saved our department hundreds of administrative hours.”
            </blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">SR</div>
              <div className="author-info">
                <strong>Sophia Reyes</strong>
                <span>Academic Director & Curriculum Chair</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="section-container faq-section">
        <div className="section-header text-center">
          <span className="section-eyebrow">Clarity</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-accordion">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{faq.q}</span>
                  <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="faq-answer-pane">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call To Action Banner */}
      <section className="cta-banner-section">
        <div className="cta-banner-card">
          <div className="cta-banner-glow" />
          <div className="cta-banner-content">
            <span className="cta-eyebrow">Ready to elevate your knowledge?</span>
            <h2 className="cta-title">Start learning or teaching on LumenLearner today.</h2>
            <p className="cta-desc">
              Experience the clarity of grounded AI study partners, automated quizzes, and verified credentials.
            </p>

            <div className="cta-button-row">
              <button
                className="btn-solid large"
                onClick={() => openAuth('register', 'STUDENT')}
              >
                Create Student Account Free
              </button>
              <button
                className="btn-outline large"
                onClick={() => openAuth('register', 'INSTRUCTOR')}
              >
                Apply as Instructor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand-col">
            <div className="nav-brand">
              <span className="brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                    fill="url(#footGrad)"
                  />
                  <defs>
                    <linearGradient id="footGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f2b84b" />
                      <stop offset="1" stopColor="#8c7cf0" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="brand-text">
                Lumen<em>Learner</em>
              </span>
            </div>
            <p className="footer-tagline">
              Illuminating education with grounded AI, verified credentials, and frictionless course delivery.
            </p>
            <div className="footer-status-badge">
              <span className="status-dot-pulse" />
              <span>Platform Operational · Gemini Active</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Platform</h4>
            <a href="#demo">AI Live Demo</a>
            <a href="#features">Feature Suite</a>
            <a href="#roles">Learner Hub</a>
            <a href="#courses">Course Catalog</a>
          </div>

          <div className="footer-links-col">
            <h4>Technology</h4>
            <span>Google Gemini AI</span>
            <span>PERN Architecture</span>
            <span>OfficeParser Engine</span>
            <span>PDFKit Credentials</span>
          </div>

          <div className="footer-links-col">
            <h4>Community</h4>
            <a href="#faq">Knowledge Base & FAQ</a>
            <button className="footer-text-btn" onClick={() => openAuth('register', 'INSTRUCTOR')}>
              Instructor Portal
            </button>
            <button className="footer-text-btn" onClick={() => openAuth('login')}>
              Account Sign In
            </button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} LumenLearner. Built with precision for deep learning.</p>
          <div className="footer-bottom-actions">
            <button className="theme-toggle-inline" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal with Initial State Passing */}
      {modalOpen && (
        <AuthModal
          onClose={() => setModalOpen(false)}
          initialMode={modalMode}
          initialRole={modalRole}
        />
      )}
    </div>
  );
};

export default Landing;
