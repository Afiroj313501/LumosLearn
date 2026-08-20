import { useState, useEffect, FormEvent } from 'react';
import { getMyCourses, createCourse, deleteCourse } from '../api/courses';
import type { Course } from '../api/courses';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="instructor-dash">
      <header className="dash-header">
        <div>
          <p className="dash-eyebrow">Instructor</p>
          <h1>Your courses</h1>
        </div>
        <button className="btn-solid" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New course'}
        </button>
      </header>

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
            <div className="course-card" key={c.id}>
              <span className="course-category">{c.category || 'General'}</span>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <div className="course-stats">
                <span>{c.lessons?.length || 0} lessons</span>
                <span>{c.enrollments?.length || 0} students</span>
              </div>
              <button className="btn-danger" onClick={() => handleDelete(c.id)}>
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