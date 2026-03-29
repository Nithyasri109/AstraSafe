import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Camera } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '',
    emergencyPin: '1234',
    emergencyNumber: '112',
    profileImage: null
  });
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/data', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) {
          setProfile({
            name: data.name || profile.name,
            email: data.email || profile.email,
            phone: data.phone || profile.phone,
            emergencyPin: data.emergencyPin || profile.emergencyPin,
            emergencyNumber: data.emergencyNumber || profile.emergencyNumber,
            profileImage: data.profileImage || profile.profileImage
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profileImage: reader.result });
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and security pin</p>
      </div>

      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.5rem' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} />
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', zIndex: 10 }}
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
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
