import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { Dashboard } from './pages/teacher/Dashboard';
import { ActiveSession } from './pages/teacher/ActiveSession';
import { Reports } from './pages/teacher/Reports';
import { Students } from './pages/teacher/Students';
import { Schedule } from './pages/teacher/Schedule';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/teacher/dashboard" element={<Dashboard />} />
        <Route path="/teacher/session" element={<ActiveSession />} />
        <Route path="/teacher/reports" element={<Reports />} />
        <Route path="/teacher/students" element={<Students />} />
        <Route path="/teacher/schedule" element={<Schedule />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
