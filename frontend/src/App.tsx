import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { Dashboard } from './pages/teacher/Dashboard';
import { ActiveSession } from './pages/teacher/ActiveSession';
import { Reports } from './pages/teacher/Reports';
import { Students } from './pages/teacher/Students';
import { Schedule } from './pages/teacher/Schedule';
import { Scanner } from './pages/student/Scanner';
import { GPSValidation } from './pages/student/GPSValidation';
import { Success } from './pages/student/Success';
import { History } from './pages/student/History';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Teacher */}
        <Route path="/teacher/dashboard" element={<Dashboard />} />
        <Route path="/teacher/session" element={<ActiveSession />} />
        <Route path="/teacher/reports" element={<Reports />} />
        <Route path="/teacher/students" element={<Students />} />
        <Route path="/teacher/schedule" element={<Schedule />} />

        {/* Student */}
        <Route path="/student/scanner" element={<Scanner />} />
        <Route path="/student/gps" element={<GPSValidation />} />
        <Route path="/student/success" element={<Success />} />
        <Route path="/student/history" element={<History />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
