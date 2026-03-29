import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if(email && password) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          setAuth(true);
          navigate('/dashboard');
        } else {
          console.error(data.msg);
          alert(data.msg || 'Login failed');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '1rem',
      backgroundImage: 'url(/login-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="glass-panel" style={{ 
          width: '100%', 
          maxWidth: '400px', 
          textAlign: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(12px)', 
          WebkitBackdropFilter: 'blur(12px)', 
          padding: '2.5rem', 
          borderRadius: '16px', 
          boxShadow: '0 8px 32px rgba(100, 30, 150, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '800' }}>AstraSafe</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email Address" 
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
        </p>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Are you a first responder? <Link to="/volunteer/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>Volunteer Portal</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
