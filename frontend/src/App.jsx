import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function getStoredToken() {
  return localStorage.getItem('token');
}

function App() {
  const [token, setToken] = useState(getStoredToken);

  useEffect(() => {
    const handleAuthChange = () => setToken(getStoredToken());
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
