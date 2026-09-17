import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import CampaignEditor from './components/CampaignEditor';
import Analytics from './components/Analytics';
import HotspotRenderer from './components/HotspotRenderer';
import DomainManagement from './components/DomainManagement';
import LeadsManager from './components/LeadsManager';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import CallbackPage from './pages/auth/CallbackPage';
import SSOLoginPage from './pages/auth/SSOLoginPage';
import { useAuthStore } from './stores/useAuthStore';

export default function App() {
  const { user, isAuthenticated, loading } = useAuthStore();

  if (loading) return <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/sso-login" element={<SSOLoginPage />} />

        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/campaigns/:id/edit" element={isAuthenticated ? <CampaignEditor /> : <Navigate to="/login" />} />
        <Route path="/campaigns/:id/analytics" element={isAuthenticated ? <Analytics /> : <Navigate to="/login" />} />
        <Route path="/domains" element={isAuthenticated ? <DomainManagement /> : <Navigate to="/login" />} />
        <Route path="/leads" element={isAuthenticated ? <LeadsManager /> : <Navigate to="/login" />} />
        <Route path="/embed/:id" element={<HotspotRenderer />} />
      </Routes>
    </BrowserRouter>
  );
}
