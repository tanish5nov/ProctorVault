import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>
          Manage the academic setup for the examination platform.
        </p>

        <div style={styles.grid}>
          <Link to="/admin/subjects" style={styles.card}>
            <h2 style={styles.cardTitle}>Subjects</h2>
            <p style={styles.cardText}>
              Create, update, and organize the master list of subjects.
            </p>
          </Link>

          <Link to="/admin/questions" style={styles.card}>
            <h2 style={styles.cardTitle}>Question Bank</h2>
            <p style={styles.cardText}>
              Build and maintain the reusable question repository by subject.
            </p>
          </Link>

          <div style={styles.cardMuted}>
            <h2 style={styles.cardTitle}>Tests</h2>
            <p style={styles.cardText}>Scheduling and assignment are not built yet.</p>
          </div>

          <div style={styles.cardMuted}>
            <h2 style={styles.cardTitle}>Results</h2>
            <p style={styles.cardText}>Evaluation and reporting are still pending.</p>
          </div>
        </div>
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
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  title: {
    margin: 0,
    color: '#1f2937',
    fontSize: '36px',
  },
  subtitle: {
    color: '#4b5563',
    marginTop: '12px',
    marginBottom: '32px',
    fontSize: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    border: '1px solid #dbe4f0',
  },
  cardMuted: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    border: '1px solid #dbe4f0',
    opacity: 0.7,
  },
  cardTitle: {
    margin: '0 0 12px',
    color: '#111827',
    fontSize: '22px',
  },
  cardText: {
    margin: 0,
    color: '#4b5563',
    lineHeight: 1.5,
  },
};

export default AdminDashboard;
