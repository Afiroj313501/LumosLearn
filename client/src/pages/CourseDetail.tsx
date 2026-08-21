import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../api/courses';
import type { Course } from '../api/courses';
import { enrollInCourse, checkEnrollment } from '../api/enrollments';
import { useAuth } from '../context/AuthContext';
import { API_ORIGIN } from '../api/config';
import { getAssignmentsByCourse, submitAssignment, getMySubmission } from '../api/assignments';
import type { Assignment, Submission } from '../api/assignments';
import { uploadFile } from '../api/upload';
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

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission | null>>({});
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const loadData = async () => {
    if (!courseId) return;
    try {
      const courseRes = await getCourseById(courseId);
      setCourse(courseRes.data);

      let isEnrolled = false;
      if (user?.role === 'STUDENT') {
        const enrollRes = await checkEnrollment(courseId);
        isEnrolled = enrollRes.data.enrolled;
        setEnrolled(isEnrolled);
      }

      const assignRes = await getAssignmentsByCourse(courseId);
      setAssignments(assignRes.data);

      if (user?.role === 'STUDENT') {
        const subs: Record<string, Submission | null> = {};
        for (const a of assignRes.data) {
          const subRes = await getMySubmission(a.id);
          subs[a.id] = subRes.data;
        }
        setMySubmissions(subs);
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

  const handleSubmitAssignment = async (assignmentId: string, file: File) => {
    setUploadingFor(assignmentId);
    try {
      const uploadRes = await uploadFile(file);
      await submitAssignment(assignmentId, {
        fileUrl: uploadRes.data.fileUrl,
        fileName: uploadRes.data.fileName,
      });
      const subRes = await getMySubmission(assignmentId);
      setMySubmissions((prev) => ({ ...prev, [assignmentId]: subRes.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFor(null);
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

      <h2 className="l<a<aessons-heading">Lessons</h2>
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

      {assignments.length > 0 && (
        <>
          <h2 className="lessons-heading" style={{ marginTop: '40px' }}>Assignments</h2>
          <div className="lesson-list">
            {assignments.map((a) => {
              const mySub = mySubmissions[a.id];
              return (
                <div className="lesson-item-detail" key={a.id} style={{ padding: '18px 20px' }}>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', margin: '0 0 8px', color: 'var(--text-primary)' }}>
                    {a.title}
                  </h3>
                  <p className="lesson-text">{a.description}</p>
                  {a.dueDate && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '8px 0' }}>
                      Due {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                  )}

                  {user?.role === 'STUDENT' && canView && (
                    mySub ? (
                      <div style={{ marginTop: '10px' }}>
                        <span className="file-download-link">
                          Submitted: {mySub.fileName}
                        </span>
                        {mySub.grade != null && (
                          <p style={{ fontSize: '13px', color: 'var(--accent-lumen)', marginTop: '8px' }}>
                            Grade: {mySub.grade}
                          </p>
                        )}
                      </div>
                    ) : (
                      <label className="file-input-label" style={{ marginTop: '10px' }}>
                        {uploadingFor === a.id ? 'Uploading...' : 'Upload your submission'}
                        <input
                          type="file"
                          disabled={uploadingFor === a.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleSubmitAssignment(a.id, f);
                          }}
                        />
                      </label>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseDetail;