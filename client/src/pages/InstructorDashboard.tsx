import { useState, useEffect, FormEvent } from 'react';
import { getMyCourses, createCourse, deleteCourse } from '../api/courses';
import type { Course } from '../api/courses';
import './InstructorDashboard.css';
import { useNavigate } from 'react-router-dom';
import { generateOutline } from '../api/ai';
import type { OutlineModule } from '../api/ai';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [showOutlineTool, setShowOutlineTool] = useState(false);
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineResult, setOutlineResult] = useState<OutlineModule[]>([]);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [outlineError, setOutlineError] = useState('');

  const loadCourses = async () => {
    try {
      const res = await getMyCourses();
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createCourse(formData);
      setFormData({ title: '', description: '', category: '' });
      setShowForm(false);
      loadCourses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await deleteCourse(id);
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateOutline = async () => {
    if (!outlineTopic.trim()) {
      setOutlineError('Enter a topic first');
      return;
    }
    setOutlineError('');
    setGeneratingOutline(true);
    try {
      const res = await generateOutline(outlineTopic, 5);
      setOutlineResult(res.data.outline);
    } catch (err: any) {
      setOutlineError(err.response?.data?.error || 'Failed to generate outline');
    } finally {
      setGeneratingOutline(false);
    }
  };

  const handleUseModuleAsCourse = (mod: OutlineModule) => {
    setFormData({ title: mod.title, description: mod.description, category: '' });
    setShowForm(true);
    setShowOutlineTool(false);
  };

  return (
    <div className="instructor-dash">
          <header className="dash-header">
        <div>
          <p className="dash-eyebrow">Instructor</p>
          <h1>Your courses</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ai-generate" onClick={() => setShowOutlineTool(!showOutlineTool)}>
            {showOutlineTool ? 'Cancel' : 'AI course outline'}
          </button>
          <button className="btn-solid" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New course'}
          </button>
        </div>
      </header>

      {showOutlineTool && (
        <div className="quiz-builder" style={{ maxWidth: '600px' }}>
          {outlineError && <p className="form-error">{outlineError}</p>}
          <input
            placeholder="Course topic (e.g. 'Intro to Organic Chemistry')"
            value={outlineTopic}
            onChange={(e) => setOutlineTopic(e.target.value)}
          />
          <button
            className="btn-ai-generate"
            onClick={handleGenerateOutline}
            disabled={generatingOutline}
          >
            {generatingOutline ? 'Generating...' : 'Generate outline'}
          </button>

          {outlineResult.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {outlineResult.map((mod, idx) => (
                <div className="quiz-question-block" key={idx}>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    {idx + 1}. {mod.title}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                    {mod.description}
                  </p>
                  <button className="btn-outline-small" onClick={() => handleUseModuleAsCourse(mod)}>
                    Use as new course
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form className="course-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          <input
            placeholder="Course title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Course description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
          />
          <input
            placeholder="Category (optional)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <button type="submit" className="btn-solid" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create course'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="dash-empty">Loading your courses…</p>
      ) : courses.length === 0 ? (
        <p className="dash-empty">You haven't created any courses yet.</p>
      ) : (
        <div className="course-grid">
          {courses.map((c) => (
            <div
              className="course-card"
              key={c.id}
              onClick={() => navigate(`/instructor/course/${c.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <span className="course-category">{c.category || 'General'}</span>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <div className="course-stats">
                <span>{c.lessons?.length || 0} lessons</span>
                <span>{c.enrollments?.length || 0} students</span>
              </div>
              <button
                className="btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(c.id);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;