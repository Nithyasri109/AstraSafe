import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

const VolunteerLogin = ({ setAuth }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/volunteer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', 'volunteer');
        setAuth(true);
        navigate('/volunteer/dashboard');
      } else {
        alert(data.msg || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--background)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <HeartPulse size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: '800' }}>Volunteer Login</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ready to help your community?</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Phone Number or Email" 
            className="input-field"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '1.5rem' }}
          />
          <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>Sign In</button>
        </form>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Not a volunteer yet? <Link to="/volunteer/register" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default VolunteerLogin;
