import { useState, useEffect } from 'react';

const emptyQ = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' };

/* ─── Reusable Question Form ───────────────────────────────────── */
const QuestionForm = ({ values, setValues, onSubmit, submitLabel, onCancel }) => (
  <form onSubmit={onSubmit}>
    <div className="form-group">
      <label className="form-label">Question Text</label>
      <textarea
        placeholder="Enter the question..."
        value={values.question_text}
        onChange={e => setValues({ ...values, question_text: e.target.value })}
        required rows={3}
        style={{ marginBottom: 0 }}
      />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
      {['a', 'b', 'c', 'd'].map(opt => (
        <div key={opt} className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Option {opt.toUpperCase()}</label>
          <input
            type="text"
            placeholder={`Option ${opt.toUpperCase()}`}
            value={values[`option_${opt}`]}
            onChange={e => setValues({ ...values, [`option_${opt}`]: e.target.value })}
            required
            style={{ marginBottom: 0 }}
          />
        </div>
      ))}
    </div>
    <div className="form-group" style={{ marginTop: '12px' }}>
      <label className="form-label">Correct Answer</label>
      <select
        value={values.correct_option}
        onChange={e => setValues({ ...values, correct_option: e.target.value })}
        style={{ marginBottom: 0 }}
      >
        {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
      </select>
    </div>
    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
      <button type="submit">{submitLabel}</button>
      {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
    </div>
  </form>
);

/* ─── Admin Dashboard ──────────────────────────────────────────── */
const AdminDashboard = () => {
  const [exams, setExams]           = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState('');

  const [newExam, setNewExam]       = useState({ title: '', description: '', duration_minutes: 30 });
  const [editingExam, setEditingExam] = useState(null);

  const [selectedExam, setSelectedExam]   = useState(null);
  const [questions, setQuestions]         = useState([]);
  const [results, setResults]             = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [newQ, setNewQ]               = useState(emptyQ);
  const [editingQ, setEditingQ]       = useState(null);

  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const token = () => localStorage.getItem('token');
  const authH = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setExamsLoading(true); setExamsError('');
    try {
      const res = await fetch('http://localhost:5000/api/student/exams', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExams(data);
    } catch (err) {
      setExamsError(err.message || 'Failed to load exams.');
    } finally {
      setExamsLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/tutor/exams', {
        method: 'POST', headers: authH(), body: JSON.stringify(newExam)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Exam created successfully!');
      setNewExam({ title: '', description: '', duration_minutes: 30 });
      fetchExams();
    } catch (err) { showToast('error', err.message); }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/tutor/exams/${editingExam.id}`, {
        method: 'PUT', headers: authH(),
        body: JSON.stringify({ title: editingExam.title, description: editingExam.description, duration_minutes: editingExam.duration_minutes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Exam updated!');
      if (selectedExam?.id === editingExam.id) setSelectedExam({ ...selectedExam, ...editingExam });
      setEditingExam(null);
      fetchExams();
    } catch (err) { showToast('error', err.message); }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam? All questions and student results will be permanently removed.')) return;
    try {
      await fetch(`http://localhost:5000/api/tutor/exams/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` }
      });
      showToast('success', 'Exam deleted.');
      fetchExams();
      if (selectedExam?.id === id) setSelectedExam(null);
    } catch (err) { showToast('error', err.message); }
  };

  const selectExam = async (exam) => {
    setSelectedExam(exam); setEditingQ(null); setNewQ(emptyQ);
    setDetailLoading(true);
    try {
      const [qRes, rRes] = await Promise.all([
        fetch(`http://localhost:5000/api/student/questions/exam/${exam.id}`, { headers: { 'Authorization': `Bearer ${token()}` } }),
        fetch(`http://localhost:5000/api/tutor/results/exam/${exam.id}`,    { headers: { 'Authorization': `Bearer ${token()}` } }),
      ]);
      setQuestions(await qRes.json());
      setResults(await rRes.json());
    } catch { /* silent */ }
    finally { setDetailLoading(false); }
  };

  const handleAddQ = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/tutor/questions', {
        method: 'POST', headers: authH(),
        body: JSON.stringify({ ...newQ, exam_id: selectedExam.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Question added!');
      setNewQ(emptyQ);
      selectExam(selectedExam);
    } catch (err) { showToast('error', err.message); }
  };

  const handleUpdateQ = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/tutor/questions/${editingQ.id}`, {
        method: 'PUT', headers: authH(), body: JSON.stringify(editingQ)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Question updated!');
      setEditingQ(null);
      selectExam(selectedExam);
    } catch (err) { showToast('error', err.message); }
  };

  const handleDeleteQ = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await fetch(`http://localhost:5000/api/tutor/questions/${qId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` }
      });
      showToast('success', 'Question deleted.');
      selectExam(selectedExam);
    } catch (err) { showToast('error', err.message); }
  };

  /* ── Total stats ── */
  const totalStudents = new Set(results.map(r => r.user_id)).size;
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score / r.total_questions) * 100, 0) / results.length)
    : null;

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`alert ${toast.type === 'success' ? 'success' : 'error'}`}
          style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 400, maxWidth: '340px', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.25s ease' }}
        >
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage exams, questions, and view student results</p>
        </div>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div><div className="stat-value">{exams.length}</div><div className="stat-label">Total Exams</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">❓</div>
          <div>
            <div className="stat-value">{exams.reduce((s, e) => s + (e.question_count || 0), 0)}</div>
            <div className="stat-label">Total Questions</div>
          </div>
        </div>
        {selectedExam && (
          <>
            <div className="stat-card">
              <div className="stat-icon green">👥</div>
              <div><div className="stat-value">{results.length}</div><div className="stat-label">Attempts</div></div>
            </div>
            {avgScore !== null && (
              <div className="stat-card">
                <div className="stat-icon yellow">📊</div>
                <div><div className="stat-value">{avgScore}%</div><div className="stat-label">Avg. Score</div></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left: Exam list + create/edit form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Create / Edit Exam */}
          <div className="card card-elevated">
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h3 className="section-title">{editingExam ? '✏️ Edit Exam' : '➕ New Exam'}</h3>
              {editingExam && (
                <button className="ghost btn-sm" onClick={() => setEditingExam(null)}>Cancel</button>
              )}
            </div>
            <form onSubmit={editingExam ? handleUpdateExam : handleCreateExam}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text" placeholder="e.g. Mathematics Final Exam"
                  value={editingExam ? editingExam.title : newExam.title}
                  onChange={e => editingExam
                    ? setEditingExam({ ...editingExam, title: e.target.value })
                    : setNewExam({ ...newExam, title: e.target.value })}
                  required style={{ marginBottom: 0 }}
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Brief description of the exam..."
                  value={editingExam ? editingExam.description || '' : newExam.description}
                  onChange={e => editingExam
                    ? setEditingExam({ ...editingExam, description: e.target.value })
                    : setNewExam({ ...newExam, description: e.target.value })}
                  rows={2} style={{ marginBottom: 0 }}
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number" min="1" placeholder="30"
                  value={editingExam ? editingExam.duration_minutes : newExam.duration_minutes}
                  onChange={e => editingExam
                    ? setEditingExam({ ...editingExam, duration_minutes: e.target.value })
                    : setNewExam({ ...newExam, duration_minutes: e.target.value })}
                  required style={{ marginBottom: 0 }}
                />
              </div>
              <button type="submit" className="btn-full" style={{ marginTop: '14px' }}>
                {editingExam ? 'Save Changes' : '+ Create Exam'}
              </button>
            </form>
          </div>

          {/* Exam list */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title" style={{ margin: 0 }}>All Exams</h3>
              <span className="badge neutral">{exams.length}</span>
            </div>
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {examsLoading && <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</div>}
              {examsError  && <div className="alert error" style={{ margin: '12px' }}>{examsError}</div>}
              {!examsLoading && exams.length === 0 && (
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-state-icon">📋</div>
                  <p className="empty-state-text">No exams yet. Create your first one!</p>
                </div>
              )}
              {exams.map(exam => (
                <div
                  key={exam.id}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: selectedExam?.id === exam.id ? 'var(--primary-light)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onClick={() => selectExam(exam)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: selectedExam?.id === exam.id ? 'var(--primary)' : 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exam.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span className="badge warning" style={{ fontSize: '0.68rem' }}>⏱ {exam.duration_minutes}m</span>
                        <span className="badge info" style={{ fontSize: '0.68rem' }}>📝 {exam.question_count || 0}q</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={() => setEditingExam({ ...exam })}
                        title="Edit exam"
                      >✏️</button>
                      <button
                        className="danger btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={() => handleDeleteExam(exam.id)}
                        title="Delete exam"
                      >🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Exam detail */}
        <div>
          {!selectedExam ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.4 }}>👈</div>
              <h3 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Select an exam to manage it</h3>
              <p style={{ fontSize: '0.875rem' }}>Click any exam from the list to view questions and results.</p>
            </div>
          ) : detailLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Loading exam details...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Exam detail header */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedExam.title}</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>{selectedExam.description || 'No description'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge warning">⏱ {selectedExam.duration_minutes} min</span>
                    <span className="badge info">📝 {questions.length} questions</span>
                    <span className="badge neutral">👥 {results.length} attempts</span>
                    <button className="secondary btn-sm" onClick={() => setSelectedExam(null)}>✕</button>
                  </div>
                </div>
              </div>

              {/* Questions section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Add / Edit question form */}
                <div className="card">
                  <div className="section-header">
                    <h3 className="section-title">{editingQ ? '✏️ Edit Question' : '➕ Add Question'}</h3>
                    {editingQ && <button className="ghost btn-sm" onClick={() => setEditingQ(null)}>Cancel</button>}
                  </div>
                  <QuestionForm
                    values={editingQ || newQ}
                    setValues={editingQ ? setEditingQ : setNewQ}
                    onSubmit={editingQ ? handleUpdateQ : handleAddQ}
                    submitLabel={editingQ ? 'Save Question' : 'Add Question'}
                    onCancel={editingQ ? () => setEditingQ(null) : undefined}
                  />
                </div>

                {/* Questions list */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>Questions</h3>
                    <span className="badge neutral">{questions.length}</span>
                  </div>
                  <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
                    {questions.length === 0 ? (
                      <div className="empty-state" style={{ padding: '32px' }}>
                        <div className="empty-state-icon">❓</div>
                        <p className="empty-state-text">No questions yet. Add some using the form.</p>
                      </div>
                    ) : questions.map((q, idx) => (
                      <div
                        key={q.id}
                        style={{
                          padding: '12px 18px',
                          borderBottom: '1px solid var(--border)',
                          background: editingQ?.id === q.id ? 'var(--primary-light)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1 }}>
                            Q{idx + 1}. {q.question_text}
                          </p>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button className="secondary btn-sm" style={{ padding: '3px 7px', fontSize: '0.7rem' }} onClick={() => setEditingQ({ ...q })}>✏️</button>
                            <button className="danger btn-sm" style={{ padding: '3px 7px', fontSize: '0.7rem' }} onClick={() => handleDeleteQ(q.id)}>🗑</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {['a','b','c','d'].map(o => (
                            <span key={o} style={{ color: o.toUpperCase() === q.correct_option ? 'var(--success)' : undefined, fontWeight: o.toUpperCase() === q.correct_option ? 700 : 400 }}>
                              {o.toUpperCase() === q.correct_option ? '✓ ' : ''}{o.toUpperCase()}. {q[`option_${o}`]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>Student Results</h3>
                  <span className="badge neutral">{results.length} attempts</span>
                </div>
                {results.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-state-icon">📊</div>
                    <p className="empty-state-text">No students have taken this exam yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => {
                          const pct = Math.round((r.score / r.total_questions) * 100);
                          const passed = pct >= 50;
                          return (
                            <tr key={r.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{r.student_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.student_email}</div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{r.score} / {r.total_questions}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="progress-bar-wrap" style={{ width: '50px', height: '5px' }}>
                                    <div className={`progress-bar-fill ${passed ? 'success' : ''}`} style={{ width: `${pct}%`, background: passed ? undefined : 'var(--danger)' }} />
                                  </div>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{pct}%</span>
                                </div>
                              </td>
                              <td><span className={`badge ${passed ? 'success' : 'danger'}`}>{passed ? 'Pass' : 'Fail'}</span></td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(r.submitted_at).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
};

export default AdminDashboard;
