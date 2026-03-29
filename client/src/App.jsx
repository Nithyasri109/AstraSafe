import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import SafeLocations from './components/SafeLocations';
import Sidebar from './components/Sidebar';
import Contacts from './components/Contacts';
import Alerts from './components/Alerts';
import Profile from './components/Profile';
import VolunteerLogin from './components/VolunteerLogin';
import VolunteerRegister from './components/VolunteerRegister';
import VolunteerDashboard from './components/VolunteerDashboard';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Layout><Dashboard setAuth={setIsAuthenticated} /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/safe-places" 
          element={isAuthenticated ? <Layout><SafeLocations /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/contacts" 
          element={isAuthenticated ? <Layout><Contacts /></Layout> : <Navigate to="/login" />} 
        />
        {/* Real Routes replacing placeholders */}
        <Route 
          path="/alerts" 
          element={isAuthenticated ? <Layout><Alerts /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Layout><Profile /></Layout> : <Navigate to="/login" />} 
        />
        {/* Volunteer Routes */}
        <Route path="/volunteer/login" element={<VolunteerLogin setAuth={setIsAuthenticated} />} />
        <Route path="/volunteer/register" element={<VolunteerRegister setAuth={setIsAuthenticated} />} />
        <Route 
          path="/volunteer/dashboard" 
          element={isAuthenticated && localStorage.getItem('userType') === 'volunteer' ? <VolunteerDashboard setAuth={setIsAuthenticated} /> : <Navigate to="/volunteer/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
