import React, { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  subjectId: '',
  subjectName: '',
};

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects || []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
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

    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, formData);
        setSuccessMessage('Subject updated successfully');
      } else {
        await api.post('/subjects', formData);
        setSuccessMessage('Subject created successfully');
      }

      resetForm();
      await fetchSubjects();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setFormData({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
    });
    setSuccessMessage('');
    setError('');
  };

  const handleDelete = async (subjectId) => {
    const confirmed = window.confirm('Delete this subject?');
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await api.delete(`/subjects/${subjectId}`);
      if (editingId === subjectId) {
        resetForm();
      }
      setSuccessMessage('Subject deleted successfully');
      await fetchSubjects();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Failed to delete subject');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <section style={styles.formPanel}>
          <h1 style={styles.heading}>Subject Management</h1>
          <p style={styles.subheading}>
            Build the master subject list used later by questions and tests.
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Subject ID</label>
              <input
                type="text"
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                placeholder="e.g. CS101"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject Name</label>
              <input
                type="text"
                name="subjectName"
                value={formData.subjectName}
                onChange={handleChange}
                placeholder="e.g. Data Structures"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={saving} style={styles.primaryButton}>
                {saving ? 'Saving...' : editingId ? 'Update Subject' : 'Create Subject'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.listPanel}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Existing Subjects</h2>
            <button type="button" onClick={fetchSubjects} style={styles.refreshButton}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p style={styles.emptyState}>Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <p style={styles.emptyState}>No subjects added yet.</p>
          ) : (
            <div style={styles.subjectList}>
              {subjects.map((subject) => (
                <article key={subject._id} style={styles.subjectCard}>
                  <div>
                    <div style={styles.subjectId}>{subject.subjectId}</div>
                    <h3 style={styles.subjectName}>{subject.subjectName}</h3>
                    <p style={styles.meta}>
                      Created by {subject.createdBy?.name || 'Unknown'}
                    </p>
                  </div>

                  <div style={styles.actionRow}>
                    <button type="button" onClick={() => handleEdit(subject)} style={styles.editButton}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(subject._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
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
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
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
    backgroundColor: '#0f766e',
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
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  listTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '24px',
  },
  refreshButton: {
    border: '1px solid #94a3b8',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    color: '#334155',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  subjectList: {
    display: 'grid',
    gap: '14px',
  },
  subjectCard: {
    border: '1px solid #dbe4ee',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  subjectId: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#dff7f3',
    color: '#0f766e',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
  },
  subjectName: {
    margin: '10px 0 6px',
    color: '#111827',
    fontSize: '20px',
  },
  meta: {
    margin: 0,
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
  emptyState: {
    color: '#64748b',
    margin: 0,
  },
};

export default ManageSubjects;
