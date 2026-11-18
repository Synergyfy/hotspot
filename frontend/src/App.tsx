import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Landing from './components/Landing';
import CampaignEditor from './components/CampaignEditor';
import Analytics from './components/Analytics';
import HotspotRenderer from './components/HotspotRenderer';
import DomainManagement from './components/DomainManagement';
import LeadsManager from './components/LeadsManager';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">Loading...</div>;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes user={user} />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AppRoutes({ user }: { user: any }) {
  const location = useLocation();

  // /embed is the visitor-facing view; it keeps the default type scale.
  useEffect(() => {
    document.body.classList.toggle('embed-view', location.pathname.startsWith('/embed'));
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard /> : <Landing />} />
      <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
      <Route path="/campaigns/:id/edit" element={user ? <CampaignEditor /> : <Navigate to="/login" />} />
      <Route path="/campaigns/:id/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
      <Route path="/domains" element={user ? <DomainManagement /> : <Navigate to="/login" />} />
      <Route path="/leads" element={user ? <LeadsManager /> : <Navigate to="/login" />} />
      <Route path="/embed/:id" element={<HotspotRenderer />} />
    </Routes>
  );
}
