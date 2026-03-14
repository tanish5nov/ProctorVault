import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

const StudentDashboard = () => {
  const location = useLocation();
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        setError('');
        const [testsResponse, resultsResponse] = await Promise.all([
          api.get('/my-tests'),
          api.get('/my-results'),
        ]);
        setTests(testsResponse.data.tests || []);
        setResults(resultsResponse.data.results || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load student dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [location.key]);

  const submittedResult = location.state?.submittedResult;
  const autoSubmit = location.state?.autoSubmit;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Student Dashboard</h1>
          <p style={styles.text}>
            View assigned tests, enter active sessions, and review submitted results.
          </p>
          {submittedResult && (
            <div style={styles.success}>
              {autoSubmit ? 'Time ended. ' : ''}Test submitted. Score: {submittedResult.obtainedMarks}/
              {submittedResult.totalMarks}
            </div>
          )}
          {error && <div style={styles.error}>{error}</div>}
        </div>

        <div style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Assigned Tests</h2>
            </div>
            {loading ? (
              <p style={styles.empty}>Loading tests...</p>
            ) : tests.length === 0 ? (
              <p style={styles.empty}>No tests are assigned yet.</p>
            ) : (
              <div style={styles.list}>
                {tests.map((test) => (
                  <article key={test._id} style={styles.itemCard}>
                    <div style={styles.itemTop}>
                      <div>
                        <div style={styles.code}>{test.testId}</div>
                        <h3 style={styles.itemTitle}>{test.testName}</h3>
                      </div>
                      <div style={styles.statusBadge(test.availability)}>
                        {test.availability}
                      </div>
                    </div>
                    <p style={styles.meta}>
                      {new Date(test.startTime).toLocaleString()} to{' '}
                      {new Date(test.endTime).toLocaleString()}
                    </p>
                    <p style={styles.meta}>
                      {test.questionCount} questions, {test.totalMarks} total marks
                    </p>
                    <p style={styles.meta}>Status: {test.resultStatus}</p>
                    {test.resultStatus === 'Submitted' ? (
                      <div style={styles.scorePill}>
                        Score: {test.obtainedMarks}/{test.totalMarks}
                      </div>
                    ) : test.availability === 'Ongoing' ? (
                      <Link to={`/student/tests/${test._id}`} style={styles.primaryLink}>
                        {test.resultStatus === 'InProgress' ? 'Resume Test' : 'Start Test'}
                      </Link>
                    ) : (
                      <div style={styles.disabledLink}>Unavailable Right Now</div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Submitted Results</h2>
            </div>
            {loading ? (
              <p style={styles.empty}>Loading results...</p>
            ) : results.length === 0 ? (
              <p style={styles.empty}>No submitted results yet.</p>
            ) : (
              <div style={styles.list}>
                {results.map((result) => (
                  <article key={result._id} style={styles.itemCard}>
                    <div style={styles.itemTop}>
                      <div>
                        <div style={styles.code}>{result.test?.testId}</div>
                        <h3 style={styles.itemTitle}>{result.test?.testName}</h3>
                      </div>
                      <div style={styles.scoreHighlight}>
                        {result.obtainedMarks}/{result.totalMarks}
                      </div>
                    </div>
                    <p style={styles.meta}>
                      Submitted: {new Date(result.submittedAt).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
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
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gap: '20px',
  },
  card: {
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  panelHeader: {
    marginBottom: '16px',
  },
  panelTitle: {
    margin: 0,
    color: '#111827',
    fontSize: '22px',
  },
  list: {
    display: 'grid',
    gap: '14px',
  },
  itemCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '18px',
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  code: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '12px',
    fontWeight: 700,
  },
  itemTitle: {
    margin: '10px 0 0',
    color: '#111827',
    fontSize: '20px',
  },
  meta: {
    margin: '10px 0 0',
    color: '#64748b',
    lineHeight: 1.5,
  },
  primaryLink: {
    display: 'inline-block',
    marginTop: '14px',
    textDecoration: 'none',
    backgroundColor: '#047857',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: '10px',
  },
  disabledLink: {
    display: 'inline-block',
    marginTop: '14px',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    padding: '10px 14px',
    borderRadius: '10px',
  },
  scorePill: {
    display: 'inline-block',
    marginTop: '14px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 14px',
    borderRadius: '10px',
  },
  scoreHighlight: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    padding: '8px 12px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  empty: {
    margin: 0,
    color: '#64748b',
  },
  success: {
    marginTop: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  error: {
    marginTop: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusBadge: (availability) => ({
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 700,
    backgroundColor:
      availability === 'Ongoing' ? '#dcfce7' : availability === 'Upcoming' ? '#dbeafe' : '#f3f4f6',
    color: availability === 'Ongoing' ? '#166534' : availability === 'Upcoming' ? '#1d4ed8' : '#4b5563',
  }),
};

export default StudentDashboard;
