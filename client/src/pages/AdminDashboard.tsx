import { useState, useEffect } from 'react';
import {
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllCoursesAdmin,
  deleteCourseAdmin,
} from '../api/admin';
import type { AdminUser, AdminCourse, PlatformStats } from '../api/admin';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [tab, setTab] = useState<'users' | 'courses'>('users');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        getPlatformStats(),
        getAllUsers(),
        getAllCoursesAdmin(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as any } : u)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await deleteCourseAdmin(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-dash">
      <header className="dash-header">
        <div>
          <p className="dash-eyebrow">Admin</p>
          <h1>Platform overview</h1>
        </div>
      </header>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{stats.userCount}</span>
            <span className="stat-label">Total users</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.studentCount}</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.instructorCount}</span>
            <span className="stat-label">Instructors</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.courseCount}</span>
            <span className="stat-label">Courses</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.enrollmentCount}</span>
            <span className="stat-label">Enrollments</span>
          </div>
        </div>
      )}

      <div className="dash-tabs">
        <button className={tab === 'users' ? 'dtab active' : 'dtab'} onClick={() => setTab('users')}>
          Users ({users.length})
        </button>
        <button className={tab === 'courses' ? 'dtab active' : 'dtab'} onClick={() => setTab('courses')}>
          Courses ({courses.length})
        </button>
      </div>

      {loading ? (
        <p className="dash-empty">Loading...</p>
      ) : tab === 'users' ? (
        <div className="admin-table">
          {users.map((u) => (
            <div className="admin-row" key={u.id}>
              <div className="admin-row-main">
                <span className="admin-row-name">{u.name}</span>
                <span className="admin-row-sub">{u.email}</span>
              </div>
              <select
                className="role-select"
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
              <span className="admin-row-meta">
                {u.role === 'INSTRUCTOR' ? `${u._count.coursesTaught} courses` : `${u._count.enrollments} enrolled`}
              </span>
              <button className="btn-danger" onClick={() => handleDeleteUser(u.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-table">
          {courses.map((c) => (
            <div className="admin-row" key={c.id}>
              <div className="admin-row-main">
                <span className="admin-row-name">{c.title}</span>
                <span className="admin-row-sub">by {c.instructor.name} ({c.instructor.email})</span>
              </div>
              <span className="admin-row-meta">{c._count.lessons} lessons</span>
              <span className="admin-row-meta">{c._count.enrollments} enrolled</span>
              <button className="btn-danger" onClick={() => handleDeleteCourse(c.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;