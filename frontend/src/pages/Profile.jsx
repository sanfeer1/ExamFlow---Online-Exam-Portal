import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Shared field components ──────────────────────────────────── */
const Field = ({ label, children, full = false }) => (
  <div className="form-group" style={{ marginBottom: 0, gridColumn: full ? '1 / -1' : undefined }}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

/* ─── Profile Page ─────────────────────────────────────────────── */
const Profile = ({ user, setUser }) => {
  const isAdmin = user?.role === 'admin';

  // ── Shared fields ──
  const [name, setName]                     = useState('');
  const [username, setUsername]             = useState('');
  const [email, setEmail]                   = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [mobileNumber, setMobileNumber]     = useState('');
  const [gender, setGender]                 = useState('');
  const [dob, setDob]                       = useState('');

  // ── Student-only fields ──
  const [registerNumber, setRegisterNumber] = useState('');
  const [yearOfStudy, setYearOfStudy]       = useState('');
  const [section, setSection]               = useState('');

  // ── Shared professional/academic fields ──
  const [department, setDepartment]         = useState('');
  const [collegeName, setCollegeName]       = useState('');

  // ── Admin-only fields ──
  const [designation, setDesignation]       = useState('');
  const [employeeId, setEmployeeId]         = useState('');
  const [subjectsHandled, setSubjectsHandled] = useState('');

  // ── Security ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
    setProfilePicture(user.profile_picture || '');
    setMobileNumber(user.mobile_number || '');
    setGender(user.gender || '');
    setDob(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
    setDepartment(user.department || '');
    setCollegeName(user.college_name || '');

    if (!isAdmin) {
      setRegisterNumber(user.register_number || '');
      setYearOfStudy(user.year_of_study || '');
      setSection(user.section || '');
    } else {
      // Admin extras stored in register_number / year_of_study / section columns
      // repurposed: designation → register_number, employeeId → year_of_study, subjects → section
      setDesignation(user.register_number || '');
      setEmployeeId(user.year_of_study || '');
      setSubjectsHandled(user.section || '');
    }
  }, [user, isAdmin]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name, username, email,
          profile_picture: profilePicture,
          mobile_number: mobileNumber,
          dob: isAdmin ? null : dob,   // admins don't use dob
          gender,
          // Student fields / repurposed admin fields
          register_number:  isAdmin ? designation     : registerNumber,
          year_of_study:    isAdmin ? employeeId      : yearOfStudy,
          section:          isAdmin ? subjectsHandled : section,
          department,
          college_name: collegeName,
          currentPassword, newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
  );

  /* ── Tab config differs by role ── */
  const tabs = isAdmin
    ? [
        { id: 'basic',        label: '👤 Basic Info' },
        { id: 'professional', label: '🏫 Professional' },
        { id: 'security',     label: '🔒 Security' },
      ]
    : [
        { id: 'basic',    label: '👤 Basic Info' },
        { id: 'academic', label: '🎓 Academic' },
        { id: 'security', label: '🔒 Security' },
      ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage your tutor account and professional details'
              : 'Manage your personal information and academic details'}
          </p>
        </div>
        <button className="secondary" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
          ← Dashboard
        </button>
      </div>

      {/* Profile summary card */}
      <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Avatar with upload */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: isAdmin ? 'var(--warning-bg)' : 'var(--primary-light)',
              border: `3px solid ${isAdmin ? 'var(--warning-border)' : 'var(--border)'}`,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800,
              color: isAdmin ? 'var(--warning)' : 'var(--primary)'
            }}>
              {profilePicture
                ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (name || 'U').charAt(0).toUpperCase()
              }
            </div>
            <label style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.75rem', border: '2px solid white',
              boxShadow: 'var(--shadow-sm)'
            }} title="Change photo">
              📷
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Identity summary */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{name || 'Your Name'}</h2>
            <p style={{ margin: '2px 0 8px', fontSize: '0.875rem' }}>
              @{username || 'username'} · {email}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge ${isAdmin ? 'warning' : 'info'}`}>
                {isAdmin ? '⚙ Tutor / Admin' : '🎓 Student'}
              </span>
              {department && <span className="badge neutral">{department}</span>}
              {isAdmin && designation && <span className="badge neutral">{designation}</span>}
              {!isAdmin && registerNumber && <span className="badge neutral">ID: {registerNumber}</span>}
              {collegeName && <span className="badge neutral">{collegeName}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error   && <div className="alert error"   style={{ marginBottom: '16px' }}>⚠ {error}</div>}
      {success && <div className="alert success" style={{ marginBottom: '16px' }}>✓ {success}</div>}

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '16px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '4px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleUpdate}>

        {/* ── BASIC INFO (shared by both roles) ── */}
        {activeTab === 'basic' && (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Full Name *">
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ marginBottom: 0 }} />
              </Field>
              <Field label="Username *">
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ marginBottom: 0 }} />
              </Field>
              <Field label="Email Address *">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ marginBottom: 0 }} />
              </Field>
              <Field label="Mobile Number">
                <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="+91 9876543210" style={{ marginBottom: 0 }} />
              </Field>
              <Field label="Gender">
                <select value={gender} onChange={e => setGender(e.target.value)} style={{ marginBottom: 0 }}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>
              {/* DOB only for students */}
              {!isAdmin && (
                <Field label="Date of Birth">
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ marginBottom: 0 }} />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* ── STUDENT: Academic Details ── */}
        {!isAdmin && activeTab === 'academic' && (
          <div className="card">
            <h3 style={{ marginBottom: '4px' }}>Academic Details</h3>
            <p style={{ marginBottom: '20px', fontSize: '0.875rem' }}>Your enrollment and institution information.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Register Number / Student ID">
                <input type="text" value={registerNumber} onChange={e => setRegisterNumber(e.target.value)} placeholder="e.g. 21CS001" style={{ marginBottom: 0 }} />
              </Field>
              <Field label="Department">
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. CSE, ECE, IT" style={{ marginBottom: 0 }} />
              </Field>
              <Field label="Year of Study">
                <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} style={{ marginBottom: 0 }}>
                  <option value="">Select year</option>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </Field>
              <Field label="Section">
                <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A, B, C" style={{ marginBottom: 0 }} />
              </Field>
              <Field label="College / Institution Name" full>
                <input type="text" value={collegeName} onChange={e => setCollegeName(e.target.value)} placeholder="e.g. ABC Engineering College" style={{ marginBottom: 0 }} />
              </Field>
            </div>
          </div>
        )}

        {/* ── ADMIN: Professional Details ── */}
        {isAdmin && activeTab === 'professional' && (
          <div className="card">
            <h3 style={{ marginBottom: '4px' }}>Professional Details</h3>
            <p style={{ marginBottom: '20px', fontSize: '0.875rem' }}>Your teaching role and institution information.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Designation">
                <input
                  type="text" value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g. Assistant Professor, HOD"
                  style={{ marginBottom: 0 }}
                />
              </Field>
              <Field label="Employee / Staff ID">
                <input
                  type="text" value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-2024-001"
                  style={{ marginBottom: 0 }}
                />
              </Field>
              <Field label="Department">
                <input
                  type="text" value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  style={{ marginBottom: 0 }}
                />
              </Field>
              <Field label="College / Institution Name">
                <input
                  type="text" value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                  placeholder="e.g. ABC Engineering College"
                  style={{ marginBottom: 0 }}
                />
              </Field>
              <Field label="Subjects / Courses Handled" full>
                <input
                  type="text" value={subjectsHandled}
                  onChange={e => setSubjectsHandled(e.target.value)}
                  placeholder="e.g. Data Structures, DBMS, Operating Systems"
                  style={{ marginBottom: 0 }}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── SECURITY (shared by both roles) ── */}
        {activeTab === 'security' && (
          <div className="card">
            <h3 style={{ marginBottom: '4px' }}>Security Settings</h3>
            <p style={{ marginBottom: '20px', fontSize: '0.875rem' }}>
              Change your password. Leave all fields blank to keep your current password.
            </p>

            {/* Last login */}
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '14px 16px',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🕐</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Last Login</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Not available'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Current Password">
                <input
                  type="password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  style={{ marginBottom: 0 }}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="New Password">
                  <input
                    type="password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ marginBottom: 0 }}
                  />
                </Field>
                <Field label="Confirm New Password">
                  <input
                    type="password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{
                      marginBottom: 0,
                      borderColor: confirmPassword && confirmPassword !== newPassword ? 'var(--danger)' : undefined
                    }}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>
                      Passwords do not match
                    </p>
                  )}
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="submit" disabled={loading} style={{ minWidth: '160px' }}>
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Saving...
              </>
            ) : '💾 Save Changes'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Profile;
