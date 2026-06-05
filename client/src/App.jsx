import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import GuestPage     from './pages/GuestPage';
import WallPage      from './pages/WallPage';
import './dashboard.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Host dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Guest camera view — /e/:eventCode */}
        <Route path="/e/:eventCode" element={<GuestPage />} />

        {/* Live photo wall — /e/:eventCode/wall */}
        <Route path="/e/:eventCode/wall" element={<WallPage />} />

        {/* Legacy path kept for backwards compatibility */}
        <Route path="/events/:eventCode" element={<GuestPage />} />

        {/* Root → dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa', fontFamily: 'system-ui' }}>
      <h2 style={{ color: '#fff' }}>Page not found</h2>
      <p>Check the URL or <a href="/dashboard" style={{ color: '#a78bfa' }}>go to the dashboard</a>.</p>
    </div>
  );
}
