import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const TestResults = () => {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedResultId, setSelectedResultId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [testsResponse, studentsResponse] = await Promise.all([
          api.get('/tests'),
          api.get('/auth/students'),
        ]);
        setTests(testsResponse.data.tests || []);
        setStudents(studentsResponse.data.students || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load filters');
      }
    };

    loadDependencies();
  }, []);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/results', {
          params: {
            ...(selectedTest ? { test: selectedTest } : {}),
            ...(selectedStudent ? { student: selectedStudent } : {}),
          },
        });
        const nextResults = response.data.results || [];
        setResults(nextResults);
        setSelectedResultId((prev) => {
          if (nextResults.some((result) => result._id === prev)) {
            return prev;
          }
          return nextResults[0]?._id || '';
        });
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [selectedStudent, selectedTest]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/results', {
        params: {
          ...(selectedTest ? { test: selectedTest } : {}),
          ...(selectedStudent ? { student: selectedStudent } : {}),
        },
      });
      const nextResults = response.data.results || [];
      setResults(nextResults);
      setSelectedResultId((prev) => {
        if (nextResults.some((result) => result._id === prev)) {
          return prev;
        }
        return nextResults[0]?._id || '';
      });
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const selectedResult = useMemo(
    () => results.find((result) => result._id === selectedResultId) || null,
    [results, selectedResultId]
  );

  const averageScore = useMemo(() => {
    if (results.length === 0) {
      return 0;
    }
    const totalPercentage = results.reduce((sum, result) => {
      if (!result.totalMarks) {
        return sum;
      }
      return sum + (result.obtainedMarks / result.totalMarks) * 100;
    }, 0);

    return Math.round(totalPercentage / results.length);
  }, [results]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.headerCard}>
          <h1 style={styles.title}>Results Dashboard</h1>
          <p style={styles.subtitle}>
            Review submitted test outcomes, compare scores, and inspect answer-level correctness.
          </p>
          {error && <div style={styles.error}>{error}</div>}
        </section>

        <section style={styles.filterCard}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Filter by Test</label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              style={styles.select}
            >
              <option value="">All Tests</option>
              {tests.map((test) => (
                <option key={test._id} value={test._id}>
                  {test.testId} - {test.testName}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Filter by Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={styles.select}
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} - {student.email}
                </option>
              ))}
            </select>
          </div>

          <button type="button" onClick={fetchResults} style={styles.refreshButton}>
            Refresh
          </button>
        </section>

        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryValue}>{results.length}</strong>
            <span style={styles.summaryLabel}>Submitted Results</span>
          </div>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryValue}>{averageScore}%</strong>
            <span style={styles.summaryLabel}>Average Score</span>
          </div>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryValue}>
              {results.filter((result) => result.obtainedMarks === result.totalMarks).length}
            </strong>
            <span style={styles.summaryLabel}>Perfect Scores</span>
          </div>
        </section>

        <div style={styles.layout}>
          <section style={styles.listPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Submissions</h2>
            </div>
            {loading ? (
              <p style={styles.empty}>Loading results...</p>
            ) : results.length === 0 ? (
              <p style={styles.empty}>No submitted results match the current filters.</p>
            ) : (
              <div style={styles.resultList}>
                {results.map((result) => {
                  const percentage = result.totalMarks
                    ? Math.round((result.obtainedMarks / result.totalMarks) * 100)
                    : 0;

                  return (
                    <button
                      key={result._id}
                      type="button"
                      onClick={() => setSelectedResultId(result._id)}
                      style={styles.resultCard(result._id === selectedResultId)}
                    >
                      <div style={styles.resultTop}>
                        <div>
                          <div style={styles.resultCode}>{result.test?.testId}</div>
                          <h3 style={styles.resultTitle}>{result.student?.name}</h3>
                        </div>
                        <div style={styles.percentagePill}>{percentage}%</div>
                      </div>
                      <p style={styles.resultMeta}>{result.test?.testName}</p>
                      <p style={styles.resultMeta}>{result.student?.email}</p>
                      <p style={styles.resultMeta}>
                        Score: {result.obtainedMarks}/{result.totalMarks}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={styles.detailPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Submission Detail</h2>
            </div>
            {!selectedResult ? (
              <p style={styles.empty}>Select a submission to review its answers.</p>
            ) : (
              <div style={styles.detailContent}>
                <div style={styles.detailCard}>
                  <div style={styles.detailTop}>
                    <div>
                      <div style={styles.resultCode}>{selectedResult.test?.testId}</div>
                      <h3 style={styles.detailTitle}>
                        {selectedResult.student?.name} - {selectedResult.test?.testName}
                      </h3>
                    </div>
                    <div style={styles.scoreBadge}>
                      {selectedResult.obtainedMarks}/{selectedResult.totalMarks}
                    </div>
                  </div>
                  <p style={styles.detailMeta}>{selectedResult.student?.email}</p>
                  <p style={styles.detailMeta}>
                    Submitted: {new Date(selectedResult.submittedAt).toLocaleString()}
                  </p>
                </div>

                <div style={styles.answerList}>
                  {selectedResult.answers.map((answer, index) => (
                    <article key={answer.question?._id || index} style={styles.answerCard}>
                      <div style={styles.answerHeader}>
                        <div>
                          <div style={styles.answerCode}>{answer.question?.questionId}</div>
                          <h4 style={styles.answerSubject}>
                            {answer.question?.subject?.subjectId} - {answer.question?.subject?.subjectName}
                          </h4>
                        </div>
                        <div style={styles.answerStatus(answer.isCorrect)}>
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                      <p style={styles.answerStatement}>{answer.question?.statement}</p>
                      {answer.question?.options?.length > 0 && (
                        <div style={styles.optionList}>
                          {answer.question.options.map((option, optionIndex) => (
                            <div key={`${answer.question?._id}-${optionIndex}`} style={styles.optionItem}>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={styles.answerMetaRow}>
                        <span>Selected: {answer.selectedAnswer || 'No answer'}</span>
                        <span>Correct: {answer.question?.correctAnswer}</span>
                        <span>
                          Marks: {answer.obtainedMarks}/{answer.assignedMarks}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
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
    backgroundColor: '#eef4f8',
    padding: '32px 20px',
  },
  container: {
    maxWidth: '1380px',
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
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px 24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'end',
    flexWrap: 'wrap',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  filterGroup: {
    display: 'grid',
    gap: '6px',
    minWidth: '240px',
  },
  label: {
    color: '#334155',
    fontWeight: 600,
    fontSize: '14px',
  },
  select: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '15px',
    backgroundColor: '#ffffff',
  },
  refreshButton: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    padding: '12px 16px',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    display: 'grid',
    gap: '8px',
  },
  summaryValue: {
    color: '#7c2d12',
    fontSize: '32px',
  },
  summaryLabel: {
    color: '#64748b',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '360px minmax(0, 1fr)',
    gap: '20px',
    alignItems: 'start',
  },
  listPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  detailPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
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
  resultList: {
    display: 'grid',
    gap: '12px',
  },
  resultCard: (isActive) => ({
    border: isActive ? '2px solid #0f766e' : '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '16px',
    backgroundColor: isActive ? '#f0fdfa' : '#ffffff',
    textAlign: 'left',
    cursor: 'pointer',
  }),
  resultTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },
  resultCode: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    fontSize: '12px',
    fontWeight: 700,
  },
  resultTitle: {
    margin: '10px 0 0',
    color: '#111827',
    fontSize: '18px',
  },
  resultMeta: {
    margin: '8px 0 0',
    color: '#64748b',
    lineHeight: 1.5,
  },
  percentagePill: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    padding: '8px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '13px',
  },
  detailContent: {
    display: 'grid',
    gap: '16px',
  },
  detailCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '20px',
  },
  detailTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  detailTitle: {
    margin: '10px 0 0',
    color: '#111827',
    fontSize: '22px',
  },
  detailMeta: {
    margin: '10px 0 0',
    color: '#64748b',
  },
  scoreBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 14px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  answerList: {
    display: 'grid',
    gap: '14px',
  },
  answerCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '18px',
  },
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  answerCode: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '12px',
    fontWeight: 700,
  },
  answerSubject: {
    margin: '10px 0 0',
    color: '#111827',
    fontSize: '18px',
  },
  answerStatement: {
    margin: '16px 0',
    color: '#334155',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  optionList: {
    display: 'grid',
    gap: '8px',
    marginBottom: '14px',
  },
  optionItem: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#475569',
  },
  answerMetaRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
    color: '#475569',
  },
  answerStatus: (isCorrect) => ({
    backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2',
    color: isCorrect ? '#166534' : '#991b1b',
    padding: '8px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '13px',
  }),
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

export default TestResults;
