import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute requiredPersona="Admin">
                <div style={{ padding: '20px' }}>
                  <h2>Admin Dashboard</h2>
                  <p>Welcome to Admin Dashboard. Admin features coming soon...</p>
                </div>
              </PrivateRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute requiredPersona="Student">
                <div style={{ padding: '20px' }}>
                  <h2>Student Dashboard</h2>
                  <p>Welcome to Student Dashboard. Student features coming soon...</p>
                </div>
              </PrivateRoute>
            }
          />

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <div style={{ padding: '20px' }}>
                <h2>Page Not Found (404)</h2>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
