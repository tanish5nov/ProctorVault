import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const sessionRef = useRef(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.post(`/my-tests/${testId}/start`);
        const nextSession = response.data.session;
        sessionRef.current = nextSession;
        setSession(nextSession);

        const nextAnswers = {};
        for (const question of nextSession.test.questions) {
          nextAnswers[question.questionId] = question.selectedAnswer || '';
        }
        setAnswers(nextAnswers);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to start test');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [testId]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const endTime = new Date(session.test.endTime).getTime();
      const diff = endTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('00:00');
        window.clearInterval(intervalId);
        if (!sessionRef.current || submitting) {
          return;
        }

        setSubmitting(true);
        setError('');
        api
          .post(`/my-tests/session/${sessionRef.current.resultId}/submit`)
          .then((response) => {
            navigate('/student/dashboard', {
              state: {
                submittedResult: response.data.result,
                autoSubmit: true,
              },
            });
          })
          .catch((submitError) => {
            setError(submitError.response?.data?.message || 'Failed to submit test');
            setSubmitting(false);
          });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setTimeLeft(`${minutes}:${seconds}`);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [navigate, session, submitting]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const submitOnExit = () => {
      const currentSession = sessionRef.current;
      const token = localStorage.getItem('token');

      if (!currentSession || !token) {
        return;
      }

      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/my-tests/session/${currentSession.resultId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: '{}',
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('pagehide', submitOnExit);
    return () => window.removeEventListener('pagehide', submitOnExit);
  }, [session]);

  const sortedQuestions = useMemo(() => session?.test.questions || [], [session]);

  const saveAnswer = async (questionId, selectedAnswer) => {
    if (!sessionRef.current) {
      return;
    }

    try {
      await api.put(`/my-tests/session/${sessionRef.current.resultId}/answer`, {
        questionId,
        selectedAnswer,
      });
      setSuccessMessage('Answer saved');
      window.setTimeout(() => {
        setSuccessMessage('');
      }, 1200);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Failed to save answer');
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!sessionRef.current || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await api.post(`/my-tests/session/${sessionRef.current.resultId}/submit`);
      navigate('/student/dashboard', {
        state: {
          submittedResult: response.data.result,
          autoSubmit,
        },
      });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.centerState}>Loading test session...</div>;
  }

  if (error && !session) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h1 style={styles.title}>Test Session Unavailable</h1>
          <p style={styles.text}>{error}</p>
          <button type="button" onClick={() => navigate('/student/dashboard')} style={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.timerCard}>
            <div style={styles.timerLabel}>Time Left</div>
            <div style={styles.timerValue}>{timeLeft || '--:--'}</div>
          </div>

          <div style={styles.metaCard}>
            <h1 style={styles.title}>{session.test.testName}</h1>
            <p style={styles.text}>Test ID: {session.test.testId}</p>
            <p style={styles.text}>Questions: {sortedQuestions.length}</p>
          </div>

          {error && <div style={styles.inlineError}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          <button type="button" onClick={() => handleSubmit(false)} disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </aside>

        <section style={styles.questionPanel}>
          {sortedQuestions.map((question, index) => (
            <article key={question.questionId} style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <div style={styles.questionIndex}>Question {index + 1}</div>
                <div style={styles.markBadge}>{question.assignedMarks} marks</div>
              </div>

              <p style={styles.statement}>{question.statement}</p>
              {question.options?.length > 0 && (
                <div style={styles.optionList}>
                  {question.options.map((option, optionIndex) => (
                    <div key={`${question.questionId}-${optionIndex}`} style={styles.optionItem}>
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </div>
                  ))}
                </div>
              )}
              <p style={styles.subjectLine}>
                {question.subject?.subjectId} - {question.subject?.subjectName}
              </p>

              <textarea
                value={answers[question.questionId] || ''}
                onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
                onBlur={(e) => saveAnswer(question.questionId, e.target.value)}
                placeholder="Type your answer here. For MCQs, enter the option letter."
                style={styles.answerBox}
              />
            </article>
          ))}
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
  layout: {
    maxWidth: '1320px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '280px minmax(0, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  sidebar: {
    display: 'grid',
    gap: '16px',
    position: 'sticky',
    top: '24px',
  },
  timerCard: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '16px',
    padding: '22px',
  },
  timerLabel: {
    fontSize: '14px',
    opacity: 0.8,
  },
  timerValue: {
    fontSize: '40px',
    fontWeight: 700,
    marginTop: '8px',
  },
  metaCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '22px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  title: {
    margin: '0 0 12px',
    color: '#111827',
    fontSize: '24px',
  },
  text: {
    margin: '8px 0 0',
    color: '#475569',
    lineHeight: 1.5,
  },
  submitButton: {
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#047857',
    color: '#ffffff',
    padding: '14px 16px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  questionPanel: {
    display: 'grid',
    gap: '18px',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  questionIndex: {
    color: '#1d4ed8',
    fontWeight: 700,
  },
  markBadge: {
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '13px',
    fontWeight: 600,
  },
  statement: {
    margin: '18px 0 10px',
    color: '#0f172a',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
  },
  subjectLine: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px',
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
    color: '#334155',
  },
  answerBox: {
    width: '100%',
    minHeight: '130px',
    marginTop: '18px',
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  inlineError: {
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  success: {
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  centerState: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    backgroundColor: '#eef4f8',
  },
  errorCard: {
    maxWidth: '700px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  backButton: {
    marginTop: '16px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    padding: '10px 14px',
    cursor: 'pointer',
  },
};

export default TakeTest;
