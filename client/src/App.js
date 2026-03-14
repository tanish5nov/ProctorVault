import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManageSubjects from './pages/ManageSubjects';
import ManageQuestions from './pages/ManageQuestions';
import Unauthorized from './pages/Unauthorized';

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
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <PrivateRoute requiredPersona="Admin">
                <ManageSubjects />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <PrivateRoute requiredPersona="Admin">
                <ManageQuestions />
              </PrivateRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute requiredPersona="Student">
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />

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
