import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import GuestPage     from './pages/GuestPage';
import WallPage      from './pages/WallPage';
import LandingPage   from './pages/LandingPage';
import PricingPage   from './pages/PricingPage';
import AboutPage     from './pages/AboutPage';
import ContactPage   from './pages/ContactPage';
import TermsPage     from './pages/TermsPage';
import PrivacyPage   from './pages/PrivacyPage';
import UpgradePage    from './pages/UpgradePage';
import CheckoutPage   from './pages/CheckoutPage';
import './dashboard.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing */}
        <Route path="/"        element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about"   element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms"   element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />

        {/* Host dashboard + checkout */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/checkout"  element={<CheckoutPage />} />

        {/* Guest camera view */}
        <Route path="/e/:eventCode"      element={<GuestPage />} />
        <Route path="/e/:eventCode/wall" element={<WallPage />} />

        {/* Legacy path */}
        <Route path="/events/:eventCode" element={<GuestPage />} />

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
