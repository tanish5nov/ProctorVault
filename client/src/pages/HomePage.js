import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome to ProctorVault</h1>
        <p style={styles.subtitle}>
          University Online Examination Platform
        </p>
        <div style={styles.buttonContainer}>
          <Link to="/login" style={styles.button}>
            Login
          </Link>
          <Link to="/register" style={styles.button}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#f5f5f5',
  },
  content: {
    textAlign: 'center',
  },
  title: {
    fontSize: '48px',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '20px',
    color: '#666',
    marginBottom: '30px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  button: {
    padding: '15px 30px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default HomePage;
