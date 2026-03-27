import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Camera } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '',
    emergencyPin: '1234',
    emergencyNumber: '112'
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('smart_safety_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('smart_safety_profile', JSON.stringify(profile));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and security pin</p>
      </div>

      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.5rem' }}>
          <User size={48} />
          <button style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>
            <Camera size={16} />
          </button>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{profile.name || 'User'}</h2>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input name="name" type="text" value={profile.name} onChange={handleChange} className="input-field" style={{ paddingLeft: '3rem' }} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input name="email" type="email" value={profile.email} onChange={handleChange} className="input-field" style={{ paddingLeft: '3rem' }} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Personal Phone</label>
          <div style={{ position: 'relative' }}>
            <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input name="phone" type="tel" value={profile.phone} onChange={handleChange} className="input-field" style={{ paddingLeft: '3rem' }} placeholder="+1 234 567 8900" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Emergency PIN (for canceling SOS)</label>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input name="emergencyPin" type="password" value={profile.emergencyPin} onChange={handleChange} className="input-field" style={{ paddingLeft: '3rem' }} maxLength="4" required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-muted)' }}>Emergency Number (e.g. 112, 911)</label>
          <div style={{ position: 'relative' }}>
            <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input name="emergencyNumber" type="tel" value={profile.emergencyNumber || '112'} onChange={handleChange} className="input-field" style={{ paddingLeft: '3rem' }} required />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <Save size={20} />
          {isSaved ? 'Changes Saved!' : 'Save Details'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
