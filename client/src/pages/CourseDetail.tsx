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
import { markLessonComplete, unmarkLessonComplete, getCourseProgress } from '../api/progress';
import { getQuizByLesson, submitQuiz, getMyQuizSubmission, getQuizReview } from '../api/quizzes';
import type { Quiz, QuizSubmission, QuizReviewItem } from '../api/quizzes';
import { issueCertificate, getMyCertificate } from '../api/certificate';
import type { Certificate } from '../api/certificate';
import { summarizeLesson } from '../api/lessons';
import StudyAssistant from '../components/StudyAssistant';
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
  const [enrollError, setEnrollError] = useState('');
  const [enrollPasswordInput, setEnrollPasswordInput] = useState('');
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission | null>>({});
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [progressPct, setProgressPct] = useState(0);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const [quizzesByLesson, setQuizzesByLesson] = useState<Record<string, Quiz | null>>({});
  const [quizSubmissions, setQuizSubmissions] = useState<Record<string, QuizSubmission | null>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<string, string>>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<Record<string, { score: number; correctCount: number; total: number }>>({});
  const [quizReviews, setQuizReviews] = useState<Record<string, QuizReviewItem[]>>({});
  const [showingReviewFor, setShowingReviewFor] = useState<string | null>(null);

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [issuingCert, setIssuingCert] = useState(false);

  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState('');

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

        if (isEnrolled) {
          const progRes = await getCourseProgress(courseId);
          const ids = new Set(progRes.data.completedLessonIds);
          setCompletedLessonIds(ids);
          const total = courseRes.data.lessons?.length || 0;
          setProgressPct(total > 0 ? (ids.size / total) * 100 : 0);

          const certRes = await getMyCertificate(courseId);
          setCertificate(certRes.data);
        }
      }

      const assignRes = await getAssignmentsByCourse(courseId);
      setAssignments(assignRes.data);

      if (user?.role === 'STUDENT') {
        const subResults = await Promise.all(
          assignRes.data.map((a) => getMySubmission(a.id))
        );
        const subs: Record<string, Submission | null> = {};
        assignRes.data.forEach((a, idx) => {
          subs[a.id] = subResults[idx].data;
        });
        setMySubmissions(subs);
      }

      if (courseRes.data.lessons) {
        const quizResults = await Promise.all(
          (courseRes.data.lessons as any[]).map((l) => getQuizByLesson(l.id))
        );

        const quizzes: Record<string, Quiz | null> = {};
        (courseRes.data.lessons as any[]).forEach((l, idx) => {
          quizzes[l.id] = quizResults[idx].data;
        });
        setQuizzesByLesson(quizzes);

        if (user?.role === 'STUDENT') {
          const quizzesWithData = quizResults.filter((r) => r.data);
          const subResults = await Promise.all(
            quizzesWithData.map((r) => getMyQuizSubmission(r.data!.id))
          );
          const qSubs: Record<string, QuizSubmission | null> = {};
          quizzesWithData.forEach((r, idx) => {
            qSubs[r.data!.id] = subResults[idx].data;
          });
          setQuizSubmissions(qSubs);
        }
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
    setEnrollError('');
    setEnrolling(true);
    try {
      await enrollInCourse(courseId, enrollPasswordInput || undefined);
      setEnrolled(true);
    } catch (err: any) {
      setEnrollError(err.response?.data?.error || 'Failed to enroll');
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

  const handleToggleComplete = async (lessonId: string) => {
    setMarkingId(lessonId);
    try {
      const isCompleted = completedLessonIds.has(lessonId);
      const res = isCompleted
        ? await unmarkLessonComplete(lessonId)
        : await markLessonComplete(lessonId);

      const newSet = new Set(completedLessonIds);
      if (isCompleted) newSet.delete(lessonId);
      else newSet.add(lessonId);
      setCompletedLessonIds(newSet);
      setProgressPct(res.data.progressPct);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleAnswerChange = (quizId: string, questionId: string, value: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [quizId]: { ...(prev[quizId] || {}), [questionId]: value },
    }));
  };

  const handleSubmitQuiz = async (quizId: string) => {
    setSubmittingQuiz(quizId);
    try {
      const answers = quizAnswers[quizId] || {};
      const res = await submitQuiz(quizId, answers);
      setQuizResult((prev) => ({ ...prev, [quizId]: res.data }));
      const subRes = await getMyQuizSubmission(quizId);
      setQuizSubmissions((prev) => ({ ...prev, [quizId]: subRes.data }));
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmittingQuiz(null);
    }
  };

  const handleToggleReview = async (quizId: string) => {
    if (showingReviewFor === quizId) {
      setShowingReviewFor(null);
      return;
    }
    if (!quizReviews[quizId]) {
      try {
        const res = await getQuizReview(quizId);
        setQuizReviews((prev) => ({ ...prev, [quizId]: res.data.review }));
      } catch (err) {
        console.error(err);
        return;
      }
    }
    setShowingReviewFor(quizId);
  };

  const handleGetCertificate = async () => {
    if (!courseId) return;
    setIssuingCert(true);
    try {
      const res = await issueCertificate(courseId);
      setCertificate(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIssuingCert(false);
    }
  };

  const handleSummarize = async (lessonId: string) => {
    setSummaryError('');
    setSummarizingId(lessonId);
    try {
      const res = await summarizeLesson(lessonId);
      setSummaries((prev) => ({ ...prev, [lessonId]: res.data.summary }));
    } catch (err: any) {
      setSummaryError(err.response?.data?.error || 'Failed to generate summary');
    } finally {
      setSummarizingId(null);
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

      {user?.role === 'STUDENT' && !enrolled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {enrollError && <p className="form-error">{enrollError}</p>}
          <input
            type="password"
            placeholder="Enrollment password (if required)"
            value={enrollPasswordInput}
            onChange={(e) => setEnrollPasswordInput(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '10px',
              padding: '11px 14px',
              fontFamily: 'Sora, sans-serif',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              outline: 'none',
              maxWidth: '280px',
            }}
          />
          <button className="btn-solid" onClick={handleEnroll} disabled={enrolling} style={{ width: 'fit-content' }}>
            {enrolling ? 'Enrolling...' : 'Enroll in this course'}
          </button>
        </div>
      )}
      {user?.role === 'STUDENT' && enrolled && (
        <button className="btn-solid" disabled style={{ marginBottom: '20px' }}>
          Enrolled
        </button>
      )}

      {user?.role === 'STUDENT' && enrolled && (
        <div className="progress-summary">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress-label">{Math.round(progressPct)}% complete</span>

          {progressPct >= 100 && (
            certificate ? (
              <a
                href={`${API_ORIGIN}${certificate.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="btn-solid"
                style={{ display: 'inline-block', marginTop: '12px', textDecoration: 'none' }}
              >
                Download certificate
              </a>
            ) : (
              <button
                className="btn-solid"
                style={{ marginTop: '12px' }}
                onClick={handleGetCertificate}
                disabled={issuingCert}
              >
                {issuingCert ? 'Generating...' : 'Get certificate'}
              </button>
            )
          )}
        </div>
      )}

      <h2 className="lessons-heading">Lessons</h2>
      {course.lessons && course.lessons.length > 0 ? (
        <div className="lesson-list">
          {course.lessons.map((l: any, idx: number) => {
            const isOpen = openLessonId === l.id;
            const embedUrl = l.videoUrl ? getEmbedUrl(l.videoUrl) : null;
            const quiz = quizzesByLesson[l.id];

            return (
              <div className="lesson-item-detail" key={l.id}>
                <button
                  className="lesson-item-header"
                  onClick={() => canView && setOpenLessonId(isOpen ? null : l.id)}
                >
                  <span className="lesson-num">{String(idx + 1).padStart(2, '0')}</span>
                  <h3>{l.title}</h3>
                  {completedLessonIds.has(l.id) && <span className="lesson-done-tag">Done</span>}
                  {quiz && <span className="lesson-done-tag">Quiz</span>}
                  {!canView && <span className="lesson-locked">Enroll to unlock</span>}
                </button>

                {isOpen && canView && (
                  <div className="lesson-content-panel">
                    <p className="lesson-text">{l.content}</p>

                    <button
                      className="btn-ai-generate"
                      onClick={() => handleSummarize(l.id)}
                      disabled={summarizingId === l.id}
                    >
                      {summarizingId === l.id ? 'Summarizing...' : summaries[l.id] ? 'Regenerate summary' : 'Summarize with AI'}
                    </button>

                    {summaryError && summarizingId === null && !summaries[l.id] && (
                      <p className="form-error">{summaryError}</p>
                    )}

                    {summaries[l.id] && (
                      <div className="ai-summary-box">
                        <p className="ai-summary-label">AI Summary</p>
                        <p className="ai-summary-text">{summaries[l.id]}</p>
                      </div>
                    )}

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

                    {user?.role === 'STUDENT' && enrolled && (
                      <button
                        className={completedLessonIds.has(l.id) ? 'btn-complete done' : 'btn-complete'}
                        onClick={() => handleToggleComplete(l.id)}
                        disabled={markingId === l.id}
                      >
                        {markingId === l.id
                          ? 'Updating...'
                          : completedLessonIds.has(l.id)
                          ? 'Completed'
                          : 'Mark as complete'}
                      </button>
                    )}

                    {quiz && (
                      <div className="quiz-panel">
                        <h4 className="quiz-panel-title">{quiz.title}</h4>

                        {user?.role !== 'STUDENT' ? (
                          <p className="dash-empty">Quiz preview (instructor view).</p>
                        ) : !enrolled ? (
                          <p className="dash-empty">Enroll to take this quiz.</p>
                        ) : quizSubmissions[quiz.id] ? (
                          <div className="quiz-result">
                            <p>You scored <strong>{Math.round(quizSubmissions[quiz.id]!.score)}%</strong> on this quiz.</p>
                            <button className="btn-outline-small" onClick={() => handleToggleReview(quiz.id)}>
                              {showingReviewFor === quiz.id ? 'Hide review' : 'Review answers'}
                            </button>
                            {showingReviewFor === quiz.id && quizReviews[quiz.id] && (
                              <div className="quiz-review">
                                {quizReviews[quiz.id].map((r, rIdx) => (
                                  <div className={r.isCorrect ? 'review-item correct' : 'review-item incorrect'} key={r.id}>
                                    <p className="review-question">{rIdx + 1}. {r.text}</p>
                                    <p className="review-answer">
                                      Your answer: <strong>{r.studentAnswer || '(no answer)'}</strong>
                                    </p>
                                    {!r.isCorrect && (
                                      <p className="review-correct">
                                        Correct answer: <strong>{r.correctAnswer}</strong>
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : quizResult[quiz.id] ? (
                          <div className="quiz-result">
                            <p>
                              You got <strong>{quizResult[quiz.id].correctCount}/{quizResult[quiz.id].total}</strong> correct
                              ({Math.round(quizResult[quiz.id].score)}%).
                            </p>
                            <button className="btn-outline-small" onClick={() => handleToggleReview(quiz.id)}>
                              {showingReviewFor === quiz.id ? 'Hide review' : 'Review answers'}
                            </button>
                            {showingReviewFor === quiz.id && quizReviews[quiz.id] && (
                              <div className="quiz-review">
                                {quizReviews[quiz.id].map((r, rIdx) => (
                                  <div className={r.isCorrect ? 'review-item correct' : 'review-item incorrect'} key={r.id}>
                                    <p className="review-question">{rIdx + 1}. {r.text}</p>
                                    <p className="review-answer">
                                      Your answer: <strong>{r.studentAnswer || '(no answer)'}</strong>
                                    </p>
                                    {!r.isCorrect && (
                                      <p className="review-correct">
                                        Correct answer: <strong>{r.correctAnswer}</strong>
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="quiz-form">
                            {quiz.questions.map((q, qIdx) => (
                              <div className="quiz-question-view" key={q.id}>
                                <p className="quiz-question-text">
                                  {qIdx + 1}. {q.text}
                                </p>
                                {q.type === 'MCQ' && q.options ? (
                                  <div className="quiz-options-list">
                                    {q.options.map((opt, optIdx) => (
                                      <label className="quiz-option-label" key={optIdx}>
                                        <input
                                          type="radio"
                                          name={`q-${q.id}`}
                                          value={opt}
                                          checked={quizAnswers[quiz.id]?.[q.id!] === opt}
                                          onChange={() => handleAnswerChange(quiz.id, q.id!, opt)}
                                        />
                                        {opt}
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <input
                                    className="quiz-short-answer"
                                    placeholder="Your answer"
                                    value={quizAnswers[quiz.id]?.[q.id!] || ''}
                                    onChange={(e) => handleAnswerChange(quiz.id, q.id!, e.target.value)}
                                  />
                                )}
                              </div>
                            ))}
                            <button
                              className="btn-solid"
                              onClick={() => handleSubmitQuiz(quiz.id)}
                              disabled={submittingQuiz === quiz.id}
                            >
                              {submittingQuiz === quiz.id ? 'Submitting...' : 'Submit quiz'}
                            </button>
                          </div>
                        )}
                      </div>
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
                            Grade: {mySub.grade}%
                          </p>
                        )}
                        {mySub.feedback && (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Feedback: {mySub.feedback}
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

      {courseId && (enrolled || user?.role !== 'STUDENT') && (
        <StudyAssistant courseId={courseId} />
      )}
    </div>
  );
};

export default CourseDetail;