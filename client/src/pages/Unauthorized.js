import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Unauthorized</h1>
        <p style={styles.text}>You do not have permission to access this page.</p>
        <Link to="/" style={styles.link}>
          Return Home
        </Link>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f4f7fb',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    textAlign: 'center',
    maxWidth: '420px',
  },
  title: {
    margin: '0 0 12px',
    color: '#111827',
  },
  text: {
    color: '#475569',
    marginBottom: '20px',
  },
  link: {
    display: 'inline-block',
    textDecoration: 'none',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    padding: '10px 16px',
    borderRadius: '10px',
  },
};

export default Unauthorized;
