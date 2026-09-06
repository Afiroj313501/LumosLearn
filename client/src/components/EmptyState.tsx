import './EmptyState.css';

interface EmptyStateProps {
  icon?: 'course' | 'lesson' | 'quiz' | 'assignment' | 'user' | 'inbox' | 'search';
  title: string;
  subtitle?: string;
}

const icons: Record<string, JSX.Element> = {
  course: (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="10" y="16" width="44" height="34" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 24h44" stroke="currentColor" strokeWidth="2" />
      <path d="M20 32h24M20 39h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  lesson: (
    <svg viewBox="0 0 64 64" fill="none">
      <path d="M16 12h32v40l-16-8-16 8V12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 24h16M24 31h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" />
      <path d="M26 27c0-4 3-6 6-6s6 2 6 5c0 4-6 4-6 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="42" r="1.5" fill="currentColor" />
    </svg>
  ),
  assignment: (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="14" y="10" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M22 22h20M22 30h20M22 38h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M14 52c2-11 10-16 18-16s16 5 18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 64 64" fill="none">
      <path d="M12 20l8 20h24l8-20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="12" y="20" width="40" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 64 64" fill="none">
      <circle cx="28" cy="28" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M38 38l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const EmptyState = ({ icon = 'course', title, subtitle }: EmptyStateProps) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icons[icon]}</div>
    <p className="empty-state-title">{title}</p>
    {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
  </div>
);

export default EmptyState;