import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCourses } from '../api/courses';
import type { Course } from '../api/courses';
import { getMyEnrollments } from '../api/enrollments';
import type { Enrollment } from '../api/enrollments';
import { getRecommendations } from '../api/ai';
import type { RecommendedCourse } from '../api/ai';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [tab, setTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsFetched, setRecsFetched] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        getAllCourses(),
        getMyEnrollments(),
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const recRes = await getRecommendations();
      setRecommendations(recRes.data.recommendations);
      setRecsFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));
  const browseCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="student-dash">
      <header className="dash-header">
        <div>
          <p className="dash-eyebrow">Student</p>
          <h1>Your learning</h1>
        </div>
      </header>

      <div className="dash-tabs">
        <button
          className={tab === 'enrolled' ? 'dtab active' : 'dtab'}
          onClick={() => setTab('enrolled')}
        >
          My courses ({enrollments.length})
        </button>
        <button
          className={tab === 'browse' ? 'dtab active' : 'dtab'}
          onClick={() => setTab('browse')}
        >
          Browse courses
        </button>
      </div>

      <div className="recommendations-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p className="dash-eyebrow" style={{ margin: 0 }}>Recommended for you</p>
          <button className="btn-ai-generate" onClick={handleGetRecommendations} disabled={loadingRecs}>
            {loadingRecs ? 'Thinking...' : recsFetched ? 'Refresh recommendations' : 'Get AI recommendations'}
          </button>
        </div>

        {recommendations.length > 0 && (
          <div className="course-grid">
            {recommendations.map((r) => (
              <div className="course-card" key={r.id} onClick={() => navigate(`/course/${r.id}`)}>
                <span className="course-category">{r.category || 'General'}</span>
                <h3>{r.title}</h3>
                <p className="course-desc">{r.description}</p>
                <p className="ai-reason">{r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="dash-empty">Loading…</p>
      ) : tab === 'enrolled' ? (
        enrollments.length === 0 ? (
          <p className="dash-empty">You're not enrolled in any courses yet — browse to get started.</p>
        ) : (
          <div className="course-grid">
            {enrollments.map((e) => (
              <div
                className="course-card"
                key={e.id}
                onClick={() => navigate(`/course/${e.course.id}`)}
              >
                <span className="course-category">{e.course.category || 'General'}</span>
                <h3>{e.course.title}</h3>
                <p className="course-instructor">by {e.course.instructor.name}</p>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${e.progressPct}%` }} />
                </div>
                <span className="progress-label">{Math.round(e.progressPct)}% complete</span>
              </div>
            ))}
          </div>
        )
      ) : browseCourses.length === 0 ? (
        <p className="dash-empty">No new courses to browse right now.</p>
      ) : (
        <div className="course-grid">
          {browseCourses.map((c) => (
            <div
              className="course-card"
              key={c.id}
              onClick={() => navigate(`/course/${c.id}`)}
            >
              <span className="course-category">{c.category || 'General'}</span>
              <h3>{c.title}</h3>
              <p className="course-desc">{c.description}</p>
              <p className="course-instructor">by {c.instructor?.name}</p>
              <div className="course-stats">
                <span>{c._count?.lessons || 0} lessons</span>
                <span>{c._count?.enrollments || 0} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;