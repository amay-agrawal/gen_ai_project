import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

import DashboardHome from './pages/DashboardHome';
import Campaigns from './pages/Campaigns';
import CRM from './pages/CRM';
import Inbox from './pages/Inbox';
import KnowledgeBase from './pages/KnowledgeBase';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<div>Authenticating...</div>} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="crm" element={<CRM />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
