import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../api/courses';
import type { Course } from '../api/courses';
import { enrollInCourse, checkEnrollment } from '../api/enrollments';
import { useAuth } from '../context/AuthContext';
import { API_ORIGIN } from '../api/config';
import './CourseDetail.css';

const getEmbedUrl = (url: string) => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
};

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

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

  if (loading) return <div className="course-detail"><p className="dash-empty">Loading...</p></div>;
  if (!course) return <div className="course-detail"><p className="dash-empty">Course not found.</p></div>;

  const canView = enrolled || user?.role !== 'STUDENT';

  return (
    <div className="course-detail">
      <button className="btn-back" onClick={() => navigate(-1)}>Back</button>

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
          {enrolled ? 'Enrolled' : enrolling ? 'Enrolling...' : 'Enroll in this course'}
        </button>
      )}

      <h2 className="lessons-heading">Lessons</h2>
      {course.lessons && course.lessons.length > 0 ? (
        <div className="lesson-list">
          {course.lessons.map((l: any, idx: number) => {
            const isOpen = openLessonId === l.id;
            const embedUrl = l.videoUrl ? getEmbedUrl(l.videoUrl) : null;

            return (
              <div className="lesson-item-detail" key={l.id}>
                <button
                  className="lesson-item-header"
                  onClick={() => canView && setOpenLessonId(isOpen ? null : l.id)}
                >
                  <span className="lesson-num">{String(idx + 1).padStart(2, '0')}</span>
                  <h3>{l.title}</h3>
                  {!canView && <span className="lesson-locked">Enroll to unlock</span>}
                </button>

                {isOpen && canView && (
                  <div className="lesson-content-panel">
                    <p className="lesson-text">{l.content}</p>

                    {l.videoUrl && (
                      embedUrl ? (
                        <div className="video-embed-wrap">
                          <iframe
                            src={embedUrl}
                            title={l.title}
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a href={l.videoUrl} target="_blank" rel="noreferrer" className="video-link">
                          Watch video
                        </a>
                      )
                    )}

                    {l.fileUrl && (
                      <a
                        href={`${API_ORIGIN}${l.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="file-download-link"
                      >
                        Download {l.fileName || 'attachment'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="dash-empty">No lessons published yet.</p>
      )}
    </div>
  );
};

export default CourseDetail;