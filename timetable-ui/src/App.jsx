import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import TimetableManager from './pages/TimetableManager';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import SubjectAssignments from './pages/SubjectAssignments';
import TimeSlots from './pages/TimeSlots';
import Organization from './pages/Organization';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/timetable" replace />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/timetable" element={<TimetableManager />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/assignments" element={<SubjectAssignments />} />
          <Route path="/time-slots" element={<TimeSlots />} />
          <Route path="/organization" element={<Organization />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h1 className="text-4xl font-bold text-gray-400">
                404 – Not Found
              </h1>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;