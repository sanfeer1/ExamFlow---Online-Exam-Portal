import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

/* ─── Result Detail Modal ──────────────────────────────────────── */
const ResultDetail = ({ resultId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/results/${resultId}/detail`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDetail(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [resultId]);

  const pct = detail ? Math.round((detail.result.score / detail.result.total_questions) * 100) : 0;
  const passed = pct >= 50;
  const correct = detail ? detail.detail.filter(d => d.is_correct).length : 0;
  const wrong   = detail ? detail.detail.filter(d => !d.is_correct).length : 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Result Breakdown</h2>
            {detail && <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{detail.result.total_questions} questions total</p>}
          </div>
          <button className="secondary btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading results...</div>
        )}
        {error && <div className="alert error">{error}</div>}

        {detail && (
          <>
            {/* Score summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Score', value: `${detail.result.score}/${detail.result.total_questions}`, color: 'var(--text-primary)' },
                { label: 'Percentage', value: `${pct}%`, color: passed ? 'var(--success)' : 'var(--danger)' },
                { label: 'Correct', value: correct, color: 'var(--success)' },
                { label: 'Wrong / Skipped', value: wrong, color: 'var(--danger)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Score progress</span>
                <span className={`badge ${passed ? 'success' : 'danger'}`}>{passed ? 'PASSED' : 'FAILED'}</span>
              </div>
              <div className="progress-bar-wrap" style={{ height: '10px' }}>
                <div className={`progress-bar-fill ${passed ? 'success' : ''}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Per-question breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {detail.detail.map((item, idx) => (
                <div
                  key={item.question_id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: item.is_correct ? 'var(--success-bg)' : 'var(--danger-bg)',
                    border: `1px solid ${item.is_correct ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                      Q{idx + 1}. {item.question_text}
                    </p>
                    <span className={`badge ${item.is_correct ? 'success' : 'danger'}`} style={{ flexShrink: 0 }}>
                      {item.is_correct ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {['a', 'b', 'c', 'd'].map(opt => {
                      const O = opt.toUpperCase();
                      const isCorrect  = O === item.correct_option;
                      const isSelected = O === item.selected_option;
                      return (
                        <div
                          key={opt}
                          style={{
                            padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                            background: isCorrect ? 'var(--success-bg)' : isSelected && !isCorrect ? 'var(--danger-bg)' : 'var(--surface)',
                            border: `1px solid ${isCorrect ? 'var(--success-border)' : isSelected && !isCorrect ? 'var(--danger-border)' : 'var(--border)'}`,
                            color: isCorrect ? 'var(--success)' : isSelected && !isCorrect ? 'var(--danger)' : 'var(--text-secondary)',
                            fontWeight: isCorrect || isSelected ? 600 : 400,
                          }}
                        >
                          <strong>{O}.</strong> {item[`option_${opt}`]}
                          {isCorrect && ' ✓'}
                          {isSelected && !isCorrect && ' ✗'}
                        </div>
                      );
                    })}
                  </div>
                  {!item.selected_option && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--warning)' }}>⚠ Not answered</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Student Dashboard ────────────────────────────────────────── */
const StudentDashboard = ({ user }) => {
  const [exams, setExams]   = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchExams(), fetchResults()]);
      setLoading(false);
    })();
  }, []);

  const fetchExams = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setExams(data);
    } catch {}

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/results/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResults(await res.json());
    } catch { /* silent */ }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/results/student`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setResults(await res.json());
    } catch { /* silent */ }
  };

  const getResult = (examId) => results.find(r => r.exam_id === examId);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--text-muted)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Loading your dashboard...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const passed  = results.filter(r => r.score / r.total_questions >= 0.5).length;
  const pending = exams.filter(e => !getResult(e.id)).length;

  return (
    <div className="animate-fade-in">
      {selectedResultId && (
        <ResultDetail resultId={selectedResultId} onClose={() => setSelectedResultId(null)} />
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{exams.length}</div>
            <div className="stat-label">Total Exams</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">✍️</div>
          <div>
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Exams Taken</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{passed}</div>
            <div className="stat-label">Passed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      {/* Available Exams */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="section-header">
          <h3 className="section-title">Available Exams</h3>
          <span className="badge neutral">{exams.length} total</span>
        </div>

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">No exams available yet. Check back later.</p>
          </div>
        ) : (
          <div className="grid">
            {exams.map(exam => {
              const result = getResult(exam.id);
              const pct = result ? Math.round((result.score / result.total_questions) * 100) : null;
              const passed = pct !== null && pct >= 50;

              return (
                <div key={exam.id} className="exam-card">
                  {/* Status strip */}
                  <div style={{
                    height: '4px', borderRadius: '4px 4px 0 0', margin: '-20px -20px 16px',
                    background: result ? (passed ? 'var(--success)' : 'var(--danger)') : 'var(--primary)'
                  }} />

                  <div className="exam-card-title">{exam.title}</div>
                  <p className="exam-card-desc">{exam.description || 'No description provided.'}</p>

                  <div className="exam-card-meta">
                    <span className="badge warning">⏱ {exam.duration_minutes} min</span>
                    {exam.question_count > 0
                      ? <span className="badge info">📝 {exam.question_count} questions</span>
                      : <span className="badge neutral">No questions yet</span>
                    }
                    {result && (
                      <span className={`badge ${passed ? 'success' : 'danger'}`}>
                        {passed ? '✓ Passed' : '✗ Failed'} · {pct}%
                      </span>
                    )}
                  </div>

                  {result ? (
                    <button
                      className="secondary btn-full"
                      onClick={() => setSelectedResultId(result.id)}
                    >
                      📊 View Result Details
                    </button>
                  ) : (
                    <button
                      className="btn-full"
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      disabled={!exam.question_count}
                      title={!exam.question_count ? 'No questions added yet' : `Start ${exam.title}`}
                    >
                      {exam.question_count ? '▶ Start Exam' : 'Not Ready Yet'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Results */}
      <section>
        <div className="section-header">
          <h3 className="section-title">Past Results</h3>
          <span className="badge neutral">{results.length} attempts</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <p className="empty-state-text">No results yet. Take an exam to see your performance here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const pct = Math.round((r.score / r.total_questions) * 100);
                  const passed = pct >= 50;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</td>
                      <td>{r.score} / {r.total_questions}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-bar-wrap" style={{ width: '60px', height: '5px' }}>
                            <div className={`progress-bar-fill ${passed ? 'success' : ''}`} style={{ width: `${pct}%`, background: passed ? undefined : 'var(--danger)' }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${passed ? 'success' : 'danger'}`}>{passed ? 'Pass' : 'Fail'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <button className="ghost btn-sm" onClick={() => setSelectedResultId(r.id)}>Details →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
