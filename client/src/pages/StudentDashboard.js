import React from 'react';

const StudentDashboard = () => {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Student Dashboard</h1>
        <p style={styles.text}>
          Scheduled tests, test-taking flow, and result views are still pending implementation.
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#f4f7fb',
    padding: '40px 20px',
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  title: {
    margin: '0 0 12px',
    color: '#111827',
  },
  text: {
    margin: 0,
    color: '#4b5563',
    lineHeight: 1.6,
  },
};

export default StudentDashboard;
