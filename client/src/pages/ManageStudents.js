import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/auth/students');
        setStudents(response.data.students || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.headerCard}>
          <h1 style={styles.title}>Student Database</h1>
          <p style={styles.subtitle}>
            Browse registered students available for test assignment and monitoring.
          </p>
          {error && <div style={styles.error}>{error}</div>}
        </section>

        <section style={styles.listCard}>
          {loading ? (
            <p style={styles.empty}>Loading students...</p>
          ) : students.length === 0 ? (
            <p style={styles.empty}>No student accounts found.</p>
          ) : (
            <div style={styles.grid}>
              {students.map((student) => (
                <article key={student._id} style={styles.studentCard}>
                  <div style={styles.badge}>STUDENT</div>
                  <h2 style={styles.studentName}>{student.name}</h2>
                  <p style={styles.meta}>{student.email}</p>
                  <p style={styles.meta}>
                    Joined: {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#eef4f8',
    padding: '32px 20px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gap: '20px',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  title: {
    margin: '0 0 10px',
    color: '#111827',
    fontSize: '32px',
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  studentCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '18px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '12px',
    fontWeight: 700,
  },
  studentName: {
    margin: '12px 0 8px',
    color: '#111827',
    fontSize: '22px',
  },
  meta: {
    margin: '6px 0 0',
    color: '#64748b',
  },
  empty: {
    margin: 0,
    color: '#64748b',
  },
  error: {
    marginTop: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
};

export default ManageStudents;
