import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamInterface from './pages/ExamInterface';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

// Auth pages manage their own full-page layout; other pages use the shared container
const AUTH_PATHS = ['/login', '/register'];

function AppContent({ user, setUser }) {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      {isAuthPage ? (
        <Routes>
          <Route path="/login"    element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
        </Routes>
      ) : (
        <div className="container">
          <Routes>
            <Route path="/" element={
              <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />
            } />
            <Route path="/dashboard" element={
              user && user.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/admin" element={
              user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />
            } />
            <Route path="/profile" element={
              user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />
            } />
            <Route path="/exam/:id" element={
              user && user.role === 'student' ? <ExamInterface user={user} /> : <Navigate to="/login" />
            } />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      )}
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
    }
  }, []);

  return (
    <Router>
      <AppContent user={user} setUser={setUser} />
    </Router>
  );
}

export default App;
