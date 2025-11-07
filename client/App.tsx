// Updated App.tsx with Portal Routes
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Existing pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';

// New portal pages
import PortalLogin from './pages/portal/Login';
import PortalDashboard from './pages/portal/Dashboard';
import PortalDownload from './pages/portal/Download';

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Index />} />

        {/* Portal routes */}
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal/dashboard" element={<PortalDashboard />} />
        <Route path="/portal/download" element={<PortalDownload />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
