import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import TimetableManager from './pages/TimetableManager';
import Teachers from './pages/Teachers';           
import Subjects from './pages/Subjects';           
import SubjectAssignments from './pages/SubjectAssignments';
import TimeSlots from './pages/TimeSlots';
import Management from './pages/Management';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/timetable" replace />} />

        <Route element={<AdminLayout />}>
          <Route path="/timetable" element={<TimetableManager />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/assignments" element={<SubjectAssignments />} />
          <Route path="/time-slots" element={<TimeSlots />} />
          <Route path="/management" element={<Management />} />


          {/* later */}
          {/* <Route path="/sections"      element={<Sections />} /> */}
          {/* <Route path="/courses"       element={<Courses />} /> */}
        </Route>

        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-400">404 – Not Found</h1>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;