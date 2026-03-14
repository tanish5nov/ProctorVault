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
import ManageStudents from './pages/ManageStudents';
import ManageSubjects from './pages/ManageSubjects';
import ManageQuestions from './pages/ManageQuestions';
import ManageTests from './pages/ManageTests';
import Unauthorized from './pages/Unauthorized';
import TakeTest from './pages/TakeTest';
import TestResults from './pages/TestResults';

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
            path="/admin/students"
            element={
              <PrivateRoute requiredPersona="Admin">
                <ManageStudents />
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
          <Route
            path="/admin/tests"
            element={
              <PrivateRoute requiredPersona="Admin">
                <ManageTests />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <PrivateRoute requiredPersona="Admin">
                <TestResults />
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
          <Route
            path="/student/tests/:testId"
            element={
              <PrivateRoute requiredPersona="Student">
                <TakeTest />
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
