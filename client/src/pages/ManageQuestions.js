import React, { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  questionId: '',
  statement: '',
  optionsText: '',
  correctAnswer: '',
  subject: '',
};

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setSubjectLoading(true);
        const response = await api.get('/subjects');
        const nextSubjects = response.data.subjects || [];
        setSubjects(nextSubjects);

        if (nextSubjects.length > 0) {
          setFormData((prev) => ({
            ...prev,
            subject: prev.subject || nextSubjects[0]._id,
          }));
        }
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Failed to load subjects');
      } finally {
        setSubjectLoading(false);
      }
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    if (!subjectLoading) {
      fetchQuestions(selectedFilter);
    }
  }, [selectedFilter, subjectLoading]);

  const fetchQuestions = async (subjectFilter = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/questions', {
        params: subjectFilter ? { subject: subjectFilter } : {},
      });
      setQuestions(response.data.questions || []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      subject: subjects[0]?._id || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      questionId: formData.questionId,
      statement: formData.statement,
      correctAnswer: formData.correctAnswer,
      subject: formData.subject,
      options: formData.optionsText
        .split('\n')
        .map((option) => option.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
        setSuccessMessage('Question updated successfully');
      } else {
        await api.post('/questions', payload);
        setSuccessMessage('Question created successfully');
      }

      resetForm();
      await fetchQuestions(selectedFilter);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (question) => {
    setEditingId(question._id);
    setFormData({
      questionId: question.questionId,
      statement: question.statement,
      optionsText: (question.options || []).join('\n'),
      correctAnswer: question.correctAnswer,
      subject: question.subject?._id || '',
    });
    setError('');
    setSuccessMessage('');
  };

  const handleDelete = async (questionId) => {
    const confirmed = window.confirm('Delete this question?');
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await api.delete(`/questions/${questionId}`);
      if (editingId === questionId) {
        resetForm();
      }
      setSuccessMessage('Question deleted successfully');
      await fetchQuestions(selectedFilter);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Failed to delete question');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <section style={styles.formPanel}>
          <h1 style={styles.heading}>Question Bank</h1>
          <p style={styles.subheading}>
            Add and maintain reusable questions for future test creation.
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          {subjects.length === 0 && !subjectLoading ? (
            <div style={styles.warning}>
              Create at least one subject before adding questions.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Question ID</label>
                <input
                  type="text"
                  name="questionId"
                  value={formData.questionId}
                  onChange={handleChange}
                  placeholder="e.g. Q-DS-001"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectId} - {subject.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Question Statement</label>
                <textarea
                  name="statement"
                  value={formData.statement}
                  onChange={handleChange}
                  placeholder="Enter the full question text, including options if this is an MCQ."
                  style={styles.textarea}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Options</label>
                <textarea
                  name="optionsText"
                  value={formData.optionsText}
                  onChange={handleChange}
                  placeholder={'One option per line\nLine 1 becomes option A\nLine 2 becomes option B'}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Correct Answer</label>
                <input
                  type="text"
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleChange}
                  placeholder="e.g. B"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  disabled={saving || subjects.length === 0}
                  style={styles.primaryButton}
                >
                  {saving ? 'Saving...' : editingId ? 'Update Question' : 'Create Question'}
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
              <h2 style={styles.listTitle}>Questions</h2>
              <p style={styles.listSubtext}>Filter by subject to narrow the bank.</p>
            </div>
            <button type="button" onClick={() => fetchQuestions(selectedFilter)} style={styles.refreshButton}>
              Refresh
            </button>
          </div>

          <div style={styles.filterRow}>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.subjectId} - {subject.subjectName}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p style={styles.emptyState}>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p style={styles.emptyState}>No questions found for the current filter.</p>
          ) : (
            <div style={styles.questionList}>
              {questions.map((question) => (
                <article key={question._id} style={styles.questionCard}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.questionId}>{question.questionId}</div>
                      <h3 style={styles.questionSubject}>
                        {question.subject?.subjectId} - {question.subject?.subjectName}
                      </h3>
                    </div>
                    <div style={styles.answerPill}>Answer: {question.correctAnswer}</div>
                  </div>

                  <p style={styles.statement}>{question.statement}</p>
                  {question.options?.length > 0 && (
                    <div style={styles.optionList}>
                      {question.options.map((option, optionIndex) => (
                        <div key={`${question._id}-${optionIndex}`} style={styles.optionItem}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.cardFooter}>
                    <span style={styles.meta}>
                      Created by {question.createdBy?.name || 'Unknown'}
                    </span>
                    <div style={styles.actionRow}>
                      <button type="button" onClick={() => handleEdit(question)} style={styles.editButton}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(question._id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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
    maxWidth: '1300px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(300px, 390px) minmax(0, 1fr)',
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
  textarea: {
    width: '100%',
    minHeight: '140px',
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
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
    backgroundColor: '#7c3aed',
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
    marginBottom: '16px',
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
  filterRow: {
    marginBottom: '20px',
  },
  filterSelect: {
    width: '100%',
    maxWidth: '320px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '15px',
    backgroundColor: '#ffffff',
  },
  questionList: {
    display: 'grid',
    gap: '16px',
  },
  questionCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '20px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  questionId: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#efe7ff',
    color: '#6d28d9',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
  },
  questionSubject: {
    margin: '10px 0 0',
    color: '#111827',
    fontSize: '18px',
  },
  answerPill: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    padding: '8px 12px',
    borderRadius: '999px',
    fontWeight: 600,
    fontSize: '14px',
  },
  statement: {
    color: '#374151',
    lineHeight: 1.7,
    margin: '16px 0 20px',
    whiteSpace: 'pre-wrap',
  },
  optionList: {
    display: 'grid',
    gap: '8px',
    marginBottom: '18px',
  },
  optionItem: {
    color: '#475569',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  meta: {
    color: '#64748b',
    fontSize: '14px',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
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

export default ManageQuestions;
