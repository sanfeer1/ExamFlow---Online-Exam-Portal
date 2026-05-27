import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ExamInterface = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam]         = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]   = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState('');

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    setShowReview(false);
    try {
      const res = await fetch('http://localhost:5000/api/student/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ exam_id: id, answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitResult(data);
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 5000);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }, [isSubmitting, submitted, id, answers, navigate]);

  /* ── Fetch exam ── */
  useEffect(() => {
    (async () => {
      try {
        const [eRes, qRes] = await Promise.all([
          fetch(`http://localhost:5000/api/student/exams/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`http://localhost:5000/api/student/questions/exam/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        ]);
        const eData = await eRes.json();
        if (!eRes.ok) throw new Error(eData.error);
        setExam(eData);
        setTimeLeft(eData.duration_minutes * 60);
        setQuestions(await qRes.json());
      } catch (err) {
        setError(err.message || 'Failed to load exam.');
      }
    })();
  }, [id]);

  /* ── Timer ── */
  useEffect(() => {
    if (!exam || submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); handleSubmit(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [exam, submitted, timeLeft, handleSubmit]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const answeredCount = Object.keys(answers).length;
  const timerClass = timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : '';

  /* ── Error state ── */
  if (error) return (
    <div className="card" style={{ maxWidth: '560px', margin: '60px auto', textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
      <h2>Something went wrong</h2>
      <p style={{ marginBottom: '24px' }}>{error}</p>
      <button className="secondary" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
    </div>
  );

  /* ── Loading ── */
  if (!exam) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--text-muted)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Loading exam...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── Submitted screen ── */
  if (submitted && submitResult) {
    const pct = Math.round((submitResult.score / submitResult.total_questions) * 100);
    const passed = pct >= 50;
    return (
      <div style={{ maxWidth: '520px', margin: '60px auto' }} className="animate-fade-in">
        <div className="card" style={{ textAlign: 'center', padding: '48px 40px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: passed ? 'var(--success-bg)' : 'var(--danger-bg)', border: `3px solid ${passed ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px' }}>
            {passed ? '🎉' : '📝'}
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{passed ? 'Congratulations!' : 'Exam Submitted'}</h1>
          <p style={{ marginBottom: '28px' }}>{passed ? 'You passed this exam.' : 'Better luck next time!'}</p>

          {/* Score ring */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 40px', marginBottom: '24px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: passed ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{submitResult.score} / {submitResult.total_questions} correct</div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div className="progress-bar-wrap" style={{ height: '10px' }}>
              <div className={`progress-bar-fill ${passed ? 'success' : ''}`} style={{ width: `${pct}%`, background: passed ? undefined : 'var(--danger)' }} />
            </div>
          </div>

          <span className={`badge ${passed ? 'success' : 'danger'}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
            {passed ? '✓ PASSED' : '✗ FAILED'}
          </span>

          <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Redirecting to dashboard in a few seconds...
          </p>
          <button className="secondary" style={{ marginTop: '12px' }} onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Review screen ── */
  if (showReview) {
    const unanswered = questions.length - answeredCount;
    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Review Your Answers</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{exam.title}</p>
          </div>
          <div className={`timer-bar ${timerClass}`}>
            ⏱ {fmt(timeLeft)}
          </div>
        </div>

        {unanswered > 0 && (
          <div className="alert warning" style={{ marginBottom: '16px' }}>
            ⚠ You have <strong>{unanswered} unanswered question{unanswered > 1 ? 's' : ''}</strong>. You can still go back and answer them.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="card"
              style={{
                padding: '14px 18px', cursor: 'pointer',
                borderLeft: `4px solid ${answers[q.id] ? 'var(--success)' : 'var(--warning)'}`,
                transition: 'box-shadow 0.15s'
              }}
              onClick={() => { setCurrentIdx(idx); setShowReview(false); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>
                  Q{idx + 1}. {q.question_text}
                </p>
                {answers[q.id]
                  ? <span className="badge success">Answered: {answers[q.id]}</span>
                  : <span className="badge warning">Not answered</span>
                }
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={() => setShowReview(false)}>← Back to Exam</button>
          <button className="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : '✓ Confirm & Submit'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Main exam UI ── */
  if (questions.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
      <p>No questions available for this exam.</p>
      <button className="secondary" style={{ marginTop: '16px' }} onClick={() => navigate('/dashboard')}>Back</button>
    </div>
  );

  const q = questions[currentIdx];
  const progress = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="animate-fade-in">
      {/* Exam header bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{exam.title}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>
              Question {currentIdx + 1} of {questions.length} &nbsp;·&nbsp; {answeredCount} answered
            </p>
          </div>
          <div className={`timer-bar ${timerClass}`}>
            ⏱ {fmt(timeLeft)}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '12px' }}>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Two-column layout: question + navigator */}
      <div className="layout-sidebar">
        {/* Question panel */}
        <div className="card">
          {/* Question number chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '16px' }}>
            Question {currentIdx + 1} / {questions.length}
          </div>

          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px', lineHeight: '1.65' }}>
            {q.question_text}
          </p>

          {/* Options */}
          <div>
            {['A', 'B', 'C', 'D'].map(opt => (
              <label
                key={opt}
                className={`option-row ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
              >
                <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => {}} style={{ display: 'none' }} />
                <span className="option-letter">{opt}</span>
                <span className="option-text">{q[`option_${opt.toLowerCase()}`]}</span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <button
              className="secondary"
              onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
              disabled={currentIdx === 0}
            >
              ← Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button onClick={() => setCurrentIdx(p => p + 1)}>
                Next →
              </button>
            ) : (
              <button
                className="success"
                onClick={() => setShowReview(true)}
              >
                Review & Submit ✓
              </button>
            )}
          </div>
        </div>

        {/* Navigator sidebar */}
        <div className="sidebar-panel">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Navigator
          </div>

          <div className="q-nav-grid">
            {questions.map((_, idx) => (
              <button
                key={idx}
                className={`q-nav-btn ${currentIdx === idx ? 'current' : answers[questions[idx].id] ? 'answered' : ''}`}
                onClick={() => setCurrentIdx(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {[
              { cls: 'current',  label: 'Current' },
              { cls: 'answered', label: 'Answered' },
              { cls: '',         label: 'Not answered' },
            ].map(({ cls, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`q-nav-btn ${cls}`} style={{ width: '18px', height: '18px', padding: 0, fontSize: '0', display: 'inline-block', borderRadius: '4px', cursor: 'default' }} />
                {label}
              </div>
            ))}
          </div>

          <div className="divider" />

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{answeredCount}</strong> of {questions.length} answered
          </div>

          <button
            className="success btn-full"
            style={{ fontSize: '0.82rem', padding: '9px' }}
            onClick={() => setShowReview(true)}
          >
            Review & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
