import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonsByCourse, createLesson, deleteLesson } from '../api/lessons';
import type { Lesson } from '../api/lessons';
import { uploadFile } from '../api/upload';
import {
  getAssignmentsByCourse,
  createAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
} from '../api/assignments';
import type { Assignment, Submission } from '../api/assignments';
import { getQuizByLesson, createQuiz, deleteQuiz as deleteQuizApi } from '../api/quizzes';
import type { Quiz, QuizQuestion } from '../api/quizzes';
import { API_ORIGIN } from '../api/config';
import './CourseManage.css';

const CourseManage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', videoUrl: '' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignFormData, setAssignFormData] = useState({ title: '', description: '', dueDate: '' });
  const [assignError, setAssignError] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [quizzesByLesson, setQuizzesByLesson] = useState<Record<string, Quiz | null>>({});
  const [buildingQuizFor, setBuildingQuizFor] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { text: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' },
  ]);
  const [quizError, setQuizError] = useState('');
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const loadQuizzes = async (lessonList: Lesson[]) => {
    const results: Record<string, Quiz | null> = {};
    for (const l of lessonList) {
      try {
        const res = await getQuizByLesson(l.id);
        results[l.id] = res.data;
      } catch (err) {
        console.error(err);
      }
    }
    setQuizzesByLesson(results);
  };

  const loadLessons = async () => {
    if (!courseId) return;
    try {
      const res = await getLessonsByCourse(courseId);
      setLessons(res.data);
      loadQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!courseId) return;
    try {
      const res = await getAssignmentsByCourse(courseId);
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLessons();
    loadAssignments();
  }, [courseId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setError('');
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (file) {
        const uploadRes = await uploadFile(file);
        fileUrl = uploadRes.data.fileUrl;
        fileName = uploadRes.data.fileName;
      }

      await createLesson(courseId, {
        ...formData,
        fileUrl,
        fileName,
        order: lessons.length,
      });
      setFormData({ title: '', content: '', videoUrl: '' });
      setFile(null);
      setShowForm(false);
      loadLessons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await deleteLesson(id);
      loadLessons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setAssignError('');
    setAssignSubmitting(true);
    try {
      await createAssignment(courseId, assignFormData);
      setAssignFormData({ title: '', description: '', dueDate: '' });
      setShowAssignForm(false);
      loadAssignments();
    } catch (err: any) {
      setAssignError(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      loadAssignments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewSubmissions = async (id: string) => {
    if (viewingSubmissionsFor === id) {
      setViewingSubmissionsFor(null);
      return;
    }
    try {
      const res = await getAssignmentSubmissions(id);
      setSubmissions(res.data);
      setViewingSubmissionsFor(id);
    } catch (err) {
      console.error(err);
    }
  };

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, { text: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestion = (idx: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...quizQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuizQuestions(updated);
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...quizQuestions];
    const opts = [...(updated[qIdx].options || [])];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuizQuestions(updated);
  };

  const handleCreateQuiz = async (lessonId: string) => {
    setQuizError('');
    if (!quizTitle.trim()) {
      setQuizError('Quiz title is required');
      return;
    }
    if (quizQuestions.some((q) => !q.text.trim() || !q.correctAnswer.trim())) {
      setQuizError('All questions need text and a correct answer');
      return;
    }
    setQuizSubmitting(true);
    try {
      await createQuiz(lessonId, { title: quizTitle, questions: quizQuestions });
      setBuildingQuizFor(null);
      setQuizTitle('');
      setQuizQuestions([{ text: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' }]);
      loadQuizzes(lessons);
    } catch (err: any) {
      setQuizError(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, lessonId: string) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await deleteQuizApi(quizId);
      setQuizzesByLesson({ ...quizzesByLesson, [lessonId]: null });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="course-manage">
      <button className="btn-back" onClick={() => navigate('/instructor')}>
        Back to courses
      </button>

      <header className="dash-header">
        <div>
          <p className="dash-eyebrow">Lessons</p>
          <h1>Manage lessons</h1>
        </div>
        <button className="btn-solid" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New lesson'}
        </button>
      </header>

      {showForm && (
        <form className="lesson-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          <input
            placeholder="Lesson title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Lesson content (text)"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={5}
          />
          <input
            placeholder="Video URL (optional - YouTube, Vimeo, etc.)"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          />
          <label className="file-input-label">
            Attach PDF or PPTX (optional)
            <input
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          {file && <span className="file-selected">Selected: {file.name}</span>}
          <button type="submit" className="btn-solid" disabled={submitting}>
            {submitting ? 'Uploading & adding...' : 'Add lesson'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="dash-empty">Loading lessons...</p>
      ) : lessons.length === 0 ? (
        <p className="dash-empty">No lessons yet - add your first one above.</p>
      ) : (
        <div className="lesson-list">
          {lessons.map((l, idx) => {
            const quiz = quizzesByLesson[l.id];
            const isBuildingQuiz = buildingQuizFor === l.id;

            return (
              <div key={l.id}>
                <div className="lesson-item">
                  <span className="lesson-num">{String(idx + 1).padStart(2, '0')}</span>
                  <div className="lesson-body">
                    <h3>{l.title}</h3>
                    <p>{l.content.slice(0, 140)}{l.content.length > 140 ? '...' : ''}</p>
                    <div className="lesson-tags">
                      {l.videoUrl && <span className="lesson-video-tag">Has video</span>}
                      {l.fileUrl && <span className="lesson-file-tag">{l.fileName}</span>}
                      {quiz && <span className="lesson-video-tag">Has quiz ({quiz.questions.length} Qs)</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {quiz ? (
                      <button className="btn-danger" onClick={() => handleDeleteQuiz(quiz.id, l.id)}>
                        Delete quiz
                      </button>
                    ) : (
                      <button
                        className="btn-outline-small"
                        onClick={() => setBuildingQuizFor(isBuildingQuiz ? null : l.id)}
                      >
                        {isBuildingQuiz ? 'Cancel' : '+ Add quiz'}
                      </button>
                    )}
                    <button className="btn-danger" onClick={() => handleDelete(l.id)}>
                      Delete lesson
                    </button>
                  </div>
                </div>

                {isBuildingQuiz && (
                  <div className="quiz-builder">
                    {quizError && <p className="form-error">{quizError}</p>}
                    <input
                      placeholder="Quiz title"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                    />

                    {quizQuestions.map((q, qIdx) => (
                      <div className="quiz-question-block" key={qIdx}>
                        <div className="quiz-question-header">
                          <span>Question {qIdx + 1}</span>
                          {quizQuestions.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-small"
                              onClick={() => removeQuestion(qIdx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          placeholder="Question text"
                          value={q.text}
                          onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                        />
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                          className="quiz-select"
                        >
                          <option value="MCQ">Multiple choice</option>
                          <option value="SHORT_ANSWER">Short answer</option>
                        </select>

                        {q.type === 'MCQ' && (
                          <div className="quiz-options-grid">
                            {(q.options || []).map((opt, optIdx) => (
                              <input
                                key={optIdx}
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                              />
                            ))}
                          </div>
                        )}

                        <input
                          placeholder="Correct answer (exact text)"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                        />
                      </div>
                    ))}

                    <button type="button" className="btn-outline-small" onClick={addQuestion}>
                      + Add question
                    </button>
                    <button
                      type="button"
                      className="btn-solid"
                      onClick={() => handleCreateQuiz(l.id)}
                      disabled={quizSubmitting}
                    >
                      {quizSubmitting ? 'Saving...' : 'Save quiz'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <header className="dash-header" style={{ marginTop: '48px' }}>
        <div>
          <p className="dash-eyebrow">Assignments</p>
          <h1>Manage assignments</h1>
        </div>
        <button className="btn-solid" onClick={() => setShowAssignForm(!showAssignForm)}>
          {showAssignForm ? 'Cancel' : '+ New assignment'}
        </button>
      </header>

      {showAssignForm && (
        <form className="lesson-form" onSubmit={handleAssignSubmit}>
          {assignError && <p className="form-error">{assignError}</p>}
          <input
            placeholder="Assignment title"
            value={assignFormData.title}
            onChange={(e) => setAssignFormData({ ...assignFormData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Instructions"
            value={assignFormData.description}
            onChange={(e) => setAssignFormData({ ...assignFormData, description: e.target.value })}
            required
            rows={4}
          />
          <label className="file-input-label">
            Due date (optional)
            <input
              type="date"
              value={assignFormData.dueDate}
              onChange={(e) => setAssignFormData({ ...assignFormData, dueDate: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-solid" disabled={assignSubmitting}>
            {assignSubmitting ? 'Creating...' : 'Create assignment'}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="dash-empty">No assignments yet.</p>
      ) : (
        <div className="lesson-list">
          {assignments.map((a) => (
            <div className="lesson-item" key={a.id}>
              <div className="lesson-body">
                <h3>{a.title}</h3>
                <p>{a.description.slice(0, 140)}{a.description.length > 140 ? '...' : ''}</p>
                {a.dueDate && (
                  <span className="lesson-file-tag">
                    Due {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn-outline-small" onClick={() => handleViewSubmissions(a.id)}>
                  {viewingSubmissionsFor === a.id ? 'Hide' : 'View'} submissions
                </button>
                <button className="btn-danger" onClick={() => handleDeleteAssignment(a.id)}>
                  Delete
                </button>
              </div>

              {viewingSubmissionsFor === a.id && (
                <div className="submissions-panel">
                  {submissions.length === 0 ? (
                    <p className="dash-empty">No submissions yet.</p>
                  ) : (
                    submissions.map((s) => (
                      <div className="submission-row" key={s.id}>
                        <span>{s.student?.name}</span>
                        <a href={`${API_ORIGIN}${s.fileUrl}`} target="_blank" rel="noreferrer">
                          {s.fileName}
                        </a>
                        <span className="submission-date">
                          {new Date(s.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseManage;