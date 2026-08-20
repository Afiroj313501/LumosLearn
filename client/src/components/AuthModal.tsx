import { useState, FormEvent, ChangeEvent } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';
import './AuthModal.css';

type Mode = 'login' | 'register';

interface AuthModalProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const AuthModal = ({ onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<Mode>('login');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login'
        ? { email: formData.email, password: formData.password }
        : formData;
      const res = await api.post(endpoint, payload);
      login(res.data.user, res.data.token);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="modal-tabs">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign in
          </button>
          <button
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Get started
          </button>
        </div>

        <h2 className="modal-title">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="modal-subtitle">
          {mode === 'login'
            ? 'Sign in to pick up where you left off.'
            : 'Join LumenLearner as a student or instructor.'}
        </p>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          {mode === 'register' && (
            <input
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          {mode === 'register' && (
            <div className="role-toggle">
              <button
                type="button"
                className={formData.role === 'STUDENT' ? 'role-btn active' : 'role-btn'}
                onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
              >
                I'm a student
              </button>
              <button
                type="button"
                className={formData.role === 'INSTRUCTOR' ? 'role-btn active' : 'role-btn'}
                onClick={() => setFormData({ ...formData, role: 'INSTRUCTOR' })}
              >
                I'm an instructor
              </button>
            </div>
          )}
          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;