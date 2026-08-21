import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CourseManage from './pages/CourseManage';
import CourseDetail from './pages/CourseDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/instructor" element={
            <ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>
          } />
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/instructor/course/:courseId" element={
           <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><CourseManage /></ProtectedRoute>
          } />
          <Route path="/course/:courseId" element={
            <ProtectedRoute><CourseDetail /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;