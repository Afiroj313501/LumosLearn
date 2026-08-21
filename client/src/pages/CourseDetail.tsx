import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../api/courses';
import type { Course } from '../api/courses';
import { enrollInCourse, checkEnrollment } from '../api/enrollments';
import { useAuth } from '../context/AuthContext';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const loadData = async () => {
    if (!courseId) return;
    try {
      const courseRes = await getCourseById(courseId);
      setCourse(courseRes.data);
      if (user?.role === 'STUDENT') {
        const enrollRes = await checkEnrollment(courseId);
        setEnrolled(enrollRes.data.enrolled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      await enrollInCourse(courseId);
      setEnrolled(true);
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="course-detail"><p className="dash-empty">Loading…</p></div>;
  if (!course) return <div className="course-detail"><p className="dash-empty">Course not found.</p></div>;

  return (
    <div className="course-detail">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>

      <span className="course-category">{course.category || 'General'}</span>
      <h1>{course.title}</h1>
      <p className="course-instructor">by {course.instructor?.name}</p>
      <p className="course-desc-full">{course.description}</p>

      {user?.role === 'STUDENT' && (
        <button
          className="btn-solid"
          onClick={handleEnroll}
          disabled={enrolled || enrolling}
        >
          {enrolled ? 'Enrolled' : enrolling ? 'Enrolling…' : 'Enroll in this course'}
        </button>
      )}

      <h2 className="lessons-heading">Lessons</h2>
      {course.lessons && course.lessons.length > 0 ? (
        <div className="lesson-list">
          {course.lessons.map((l: any, idx: number) => (
            <div className="lesson-item" key={l.id}>
              <span className="lesson-num">{String(idx + 1).padStart(2, '0')}</span>
              <div className="lesson-body">
                <h3>{l.title}</h3>
                {!enrolled && user?.role === 'STUDENT' && (
                  <p className="lesson-locked">Enroll to view this lesson</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="dash-empty">No lessons published yet.</p>
      )}
    </div>
  );
};

export default CourseDetail;