import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredPersona = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPersona && user?.persona !== requiredPersona) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default PrivateRoute;
