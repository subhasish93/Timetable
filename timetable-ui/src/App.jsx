import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Department from './pages/Department';
import Courses from './pages/Courses';
import Terms from './pages/Terms';
import Sections from './pages/Sections';
import Batches from './pages/Batches';
import Subjects from './pages/Subjects';
import Faculty from './pages/Faculties';
import Rooms from './pages/Rooms';
import TimetableManager from './pages/TimetableManager';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/change-password" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ChangePassword />
          </ProtectedRoute>
        } />

        <Route element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/department" element={<Department />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sections" element={<Sections />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/timetable" element={<TimetableManager />} />
        </Route>

        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="text-xl text-gray-500 mt-2">Page Not Found</p>
              <a href="/login" className="text-blue-600 hover:underline mt-4 block">Go to Login</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
