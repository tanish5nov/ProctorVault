import React, { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  testId: '',
  testName: '',
  startTime: '',
  endTime: '',
};

const toLocalDateTimeInput = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [selectedResultsTestId, setSelectedResultsTestId] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [selectedStudents, setSelectedStudents] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dependenciesLoading, setDependenciesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setDependenciesLoading(true);
        setError('');
        const [questionsResponse, studentsResponse] = await Promise.all([
          api.get('/questions'),
          api.get('/auth/students'),
        ]);

        setQuestions(questionsResponse.data.questions || []);
        setStudents(studentsResponse.data.students || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load questions or students');
      } finally {
        setDependenciesLoading(false);
      }
    };

    loadDependencies();
  }, []);

  useEffect(() => {
    if (!dependenciesLoading) {
      fetchTests();
    }
  }, [dependenciesLoading]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/tests');
      setTests(response.data.tests || []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setSelectedQuestions({});
    setSelectedStudents({});
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestions((prev) => {
      if (prev[questionId]) {
        const nextState = { ...prev };
        delete nextState[questionId];
        return nextState;
      }

      return {
        ...prev,
        [questionId]: '1',
      };
    });
  };

  const updateQuestionMarks = (questionId, marks) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      [questionId]: marks,
    }));
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const buildPayload = () => ({
    ...formData,
    questions: Object.entries(selectedQuestions).map(([questionId, assignedMarks]) => ({
      question: questionId,
      assignedMarks: Number(assignedMarks),
    })),
    assignedStudents: Object.entries(selectedStudents)
      .filter(([, isSelected]) => isSelected)
      .map(([studentId]) => studentId),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = buildPayload();

      if (editingId) {
        await api.put(`/tests/${editingId}`, payload);
        setSuccessMessage('Test updated successfully');
      } else {
        await api.post('/tests', payload);
        setSuccessMessage('Test created successfully');
      }

      resetForm();
      await fetchTests();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (test) => {
    setEditingId(test._id);
    setFormData({
      testId: test.testId,
      testName: test.testName,
      startTime: toLocalDateTimeInput(test.startTime),
      endTime: toLocalDateTimeInput(test.endTime),
    });

    const nextQuestionMap = {};
    for (const entry of test.questions || []) {
      if (entry.question?._id) {
        nextQuestionMap[entry.question._id] = String(entry.assignedMarks);
      }
    }

    const nextStudentMap = {};
    for (const student of test.assignedStudents || []) {
      nextStudentMap[student._id] = true;
    }

    setSelectedQuestions(nextQuestionMap);
    setSelectedStudents(nextStudentMap);
    setError('');
    setSuccessMessage('');
  };

  const handleDelete = async (testId) => {
    const confirmed = window.confirm('Delete this test?');
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await api.delete(`/tests/${testId}`);
      if (editingId === testId) {
        resetForm();
      }
      setSuccessMessage('Test deleted successfully');
      await fetchTests();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Failed to delete test');
    }
  };

  const handleViewResults = async (testId) => {
    if (selectedResultsTestId === testId) {
      setSelectedResultsTestId('');
      setTestResults([]);
      return;
    }

    try {
      setResultsLoading(true);
      setError('');
      const response = await api.get('/results', {
        params: { test: testId },
      });
      setSelectedResultsTestId(testId);
      setTestResults(response.data.results || []);
    } catch (resultsError) {
      setError(resultsError.response?.data?.message || 'Failed to load test results');
    } finally {
      setResultsLoading(false);
    }
  };

  const selectedQuestionCount = Object.keys(selectedQuestions).length;
  const selectedStudentCount = Object.values(selectedStudents).filter(Boolean).length;

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <section style={styles.formPanel}>
          <h1 style={styles.heading}>Test Management</h1>
          <p style={styles.subheading}>
            Schedule tests, attach questions with marks, and assign the target students.
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          {dependenciesLoading ? (
            <p style={styles.emptyState}>Loading questions and students...</p>
          ) : questions.length === 0 || students.length === 0 ? (
            <div style={styles.warning}>
              You need at least one question and one student before a test can be created.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Test ID</label>
                <input
                  type="text"
                  name="testId"
                  value={formData.testId}
                  onChange={handleChange}
                  placeholder="e.g. MIDSEM-DS-01"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Test Name</label>
                <input
                  type="text"
                  name="testName"
                  value={formData.testName}
                  onChange={handleChange}
                  placeholder="e.g. Mid Semester Data Structures"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.twoColumnRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.selectorSection}>
                <div style={styles.selectorHeader}>
                  <h2 style={styles.selectorTitle}>Questions</h2>
                  <span style={styles.selectorCount}>{selectedQuestionCount} selected</span>
                </div>
                <div style={styles.selectorList}>
                  {questions.map((question) => {
                    const isSelected = Object.prototype.hasOwnProperty.call(
                      selectedQuestions,
                      question._id
                    );

                    return (
                      <label key={question._id} style={styles.selectorItem}>
                        <div style={styles.selectorMain}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleQuestion(question._id)}
                          />
                          <div>
                            <div style={styles.selectorCode}>{question.questionId}</div>
                            <div style={styles.selectorText}>
                              {question.subject?.subjectId} - {question.statement}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <input
                            type="number"
                            min="1"
                            value={selectedQuestions[question._id]}
                            onChange={(e) => updateQuestionMarks(question._id, e.target.value)}
                            style={styles.markInput}
                            placeholder="Marks"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={styles.selectorSection}>
                <div style={styles.selectorHeader}>
                  <h2 style={styles.selectorTitle}>Assigned Students</h2>
                  <span style={styles.selectorCount}>{selectedStudentCount} selected</span>
                </div>
                <div style={styles.studentList}>
                  {students.map((student) => (
                    <label key={student._id} style={styles.studentItem}>
                      <input
                        type="checkbox"
                        checked={!!selectedStudents[student._id]}
                        onChange={() => toggleStudent(student._id)}
                      />
                      <div>
                        <div style={styles.studentName}>{student.name}</div>
                        <div style={styles.studentEmail}>{student.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button type="submit" disabled={saving} style={styles.primaryButton}>
                  {saving ? 'Saving...' : editingId ? 'Update Test' : 'Create Test'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <section style={styles.listPanel}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.listTitle}>Scheduled Tests</h2>
              <p style={styles.listSubtext}>Review question mix, timing, and assigned students.</p>
            </div>
            <button type="button" onClick={fetchTests} style={styles.refreshButton}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p style={styles.emptyState}>Loading tests...</p>
          ) : tests.length === 0 ? (
            <p style={styles.emptyState}>No tests created yet.</p>
          ) : (
            <div style={styles.testList}>
              {tests.map((test) => (
                <article key={test._id} style={styles.testCard}>
                  <div style={styles.cardHeader}>
                    <div>
                      <div style={styles.testId}>{test.testId}</div>
                      <h3 style={styles.testName}>{test.testName}</h3>
                    </div>
                    {new Date() < new Date(test.startTime) ? (
                      <div style={styles.cardActions}>
                        <button type="button" onClick={() => handleEdit(test)} style={styles.editButton}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(test._id)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewResults(test._id)}
                          style={styles.resultsButton}
                        >
                          {selectedResultsTestId === test._id ? 'Hide Results' : 'View Results'}
                        </button>
                      </div>
                    ) : (
                      <div style={styles.cardActions}>
                        <div style={styles.lockedBadge}>Locked After Start</div>
                        <button
                          type="button"
                          onClick={() => handleViewResults(test._id)}
                          style={styles.resultsButton}
                        >
                          {selectedResultsTestId === test._id ? 'Hide Results' : 'View Results'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={styles.scheduleBlock}>
                    <span>
                      Start: {new Date(test.startTime).toLocaleString()}
                    </span>
                    <span>
                      End: {new Date(test.endTime).toLocaleString()}
                    </span>
                  </div>

                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryBox}>
                      <strong>{test.questions?.length || 0}</strong>
                      <span>Questions</span>
                    </div>
                    <div style={styles.summaryBox}>
                      <strong>{test.assignedStudents?.length || 0}</strong>
                      <span>Students</span>
                    </div>
                    <div style={styles.summaryBox}>
                      <strong>
                        {(test.questions || []).reduce(
                          (sum, entry) => sum + Number(entry.assignedMarks || 0),
                          0
                        )}
                      </strong>
                      <span>Total Marks</span>
                    </div>
                  </div>

                  <div style={styles.detailBlock}>
                    <h4 style={styles.detailTitle}>Questions</h4>
                    <div style={styles.tagWrap}>
                      {(test.questions || []).map((entry) => (
                        <span key={entry.question?._id || entry._id} style={styles.tag}>
                          {entry.question?.questionId} ({entry.assignedMarks})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={styles.detailBlock}>
                    <h4 style={styles.detailTitle}>Assigned Students</h4>
                    <div style={styles.tagWrap}>
                      {(test.assignedStudents || []).map((student) => (
                        <span key={student._id} style={styles.studentTag}>
                          {student.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedResultsTestId === test._id && (
                    <div style={styles.resultsPanel}>
                      <h4 style={styles.detailTitle}>Test Results DB</h4>
                      {resultsLoading ? (
                        <p style={styles.emptyState}>Loading results...</p>
                      ) : testResults.length === 0 ? (
                        <p style={styles.emptyState}>No submitted results for this test yet.</p>
                      ) : (
                        <div style={styles.resultsList}>
                          {testResults.map((result) => (
                            <article key={result._id} style={styles.resultCard}>
                              <div style={styles.resultCardHeader}>
                                <div>
                                  <div style={styles.resultStudent}>{result.student?.name}</div>
                                  <div style={styles.resultMeta}>{result.student?.email}</div>
                                </div>
                                <div style={styles.resultScore}>
                                  {result.obtainedMarks}/{result.totalMarks}
                                </div>
                              </div>
                              <p style={styles.resultMeta}>
                                Submitted: {new Date(result.submittedAt).toLocaleString()}
                              </p>
                              <div style={styles.answerBreakdown}>
                                {result.answers.map((answer, index) => (
                                  <div key={answer.question?._id || index} style={styles.answerRow}>
                                    <span style={styles.answerCode}>{answer.question?.questionId}</span>
                                    <span style={styles.answerValue}>
                                      Selected: {answer.selectedAnswer || 'No answer'}
                                    </span>
                                    <span style={styles.answerValue}>
                                      Correct: {answer.question?.correctAnswer}
                                    </span>
                                    <span style={styles.answerValue}>
                                      Marks: {answer.obtainedMarks}/{answer.assignedMarks}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
  layout: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(340px, 460px) minmax(0, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  formPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  listPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  },
  heading: {
    margin: '0 0 10px',
    color: '#0f172a',
    fontSize: '30px',
  },
  subheading: {
    margin: '0 0 24px',
    color: '#475569',
    lineHeight: 1.6,
  },
  formGroup: {
    marginBottom: '16px',
  },
  twoColumnRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#334155',
    fontSize: '14px',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '15px',
    backgroundColor: '#ffffff',
  },
  selectorSection: {
    marginTop: '24px',
  },
  selectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  selectorTitle: {
    margin: 0,
    color: '#111827',
    fontSize: '18px',
  },
  selectorCount: {
    color: '#64748b',
    fontSize: '14px',
  },
  selectorList: {
    display: 'grid',
    gap: '10px',
    maxHeight: '280px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  selectorItem: {
    border: '1px solid #dbe4ee',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
  },
  selectorMain: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    flex: 1,
  },
  selectorCode: {
    fontWeight: 700,
    color: '#6d28d9',
    marginBottom: '4px',
  },
  selectorText: {
    color: '#334155',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  markInput: {
    width: '90px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  studentList: {
    display: 'grid',
    gap: '10px',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  studentItem: {
    border: '1px solid #dbe4ee',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  studentName: {
    color: '#111827',
    fontWeight: 600,
  },
  studentEmail: {
    color: '#64748b',
    fontSize: '14px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '24px',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#c2410c',
    color: '#ffffff',
    padding: '12px 16px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #94a3b8',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    color: '#334155',
    padding: '12px 16px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },
  listTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '24px',
  },
  listSubtext: {
    margin: '6px 0 0',
    color: '#64748b',
  },
  refreshButton: {
    border: '1px solid #94a3b8',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    color: '#334155',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  testList: {
    display: 'grid',
    gap: '16px',
  },
  testCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  testId: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
  },
  testName: {
    margin: '10px 0 0',
    color: '#111827',
    fontSize: '22px',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
  },
  lockedBadge: {
    backgroundColor: '#e5e7eb',
    color: '#4b5563',
    padding: '10px 12px',
    borderRadius: '999px',
    fontWeight: 600,
    fontSize: '13px',
  },
  scheduleBlock: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
    color: '#475569',
    marginTop: '14px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginTop: '18px',
  },
  summaryBox: {
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    padding: '14px',
    display: 'grid',
    gap: '4px',
  },
  detailBlock: {
    marginTop: '18px',
  },
  detailTitle: {
    margin: '0 0 10px',
    color: '#334155',
    fontSize: '15px',
  },
  tagWrap: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '8px 10px',
    borderRadius: '999px',
    backgroundColor: '#fff7ed',
    color: '#9a3412',
    fontSize: '13px',
  },
  studentTag: {
    padding: '8px 10px',
    borderRadius: '999px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '13px',
  },
  editButton: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  deleteButton: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  resultsButton: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  resultsPanel: {
    marginTop: '20px',
    borderTop: '1px solid #dbe4ee',
    paddingTop: '18px',
  },
  resultsList: {
    display: 'grid',
    gap: '12px',
  },
  resultCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '12px',
    padding: '14px',
    backgroundColor: '#f8fafc',
  },
  resultCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  resultStudent: {
    color: '#111827',
    fontWeight: 700,
  },
  resultMeta: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '6px',
  },
  resultScore: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    padding: '8px 12px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  answerBreakdown: {
    display: 'grid',
    gap: '8px',
    marginTop: '12px',
  },
  answerRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  answerCode: {
    fontWeight: 700,
    color: '#1d4ed8',
  },
  answerValue: {
    color: '#475569',
    fontSize: '14px',
  },
  error: {
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  success: {
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  warning: {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#fff7ed',
    color: '#9a3412',
  },
  emptyState: {
    color: '#64748b',
    margin: 0,
  },
};

export default ManageTests;
