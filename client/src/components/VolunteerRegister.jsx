import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, CheckCircle } from 'lucide-react';

const VolunteerRegister = ({ setAuth }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('Both');
  const [consent, setConsent] = useState(true);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const navigate = useNavigate();

  const handleSimulateOTP = () => {
    if (!phone) return alert("Enter phone number first");
    setOtpSent(true);
    setTimeout(() => {
      const entered = prompt("Simulated OTP sent to phone. Enter 1234 to verify:");
      if (entered === "1234") {
        setOtpVerified(true);
        alert("Phone verified successfully!");
      } else {
        alert("Invalid OTP");
      }
    }, 500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      alert("Please verify your phone number first.");
      return;
    }
    
    try {
      if(name && password && phone) {
        const res = await fetch('/api/volunteer/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone, preferredTime, consent })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userType', 'volunteer');
          setAuth(true);
          navigate('/volunteer/dashboard');
        } else {
          console.error(data.msg);
          alert(data.msg || 'Registration failed');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--background)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <HeartPulse size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '800' }}>Volunteer Sign Up</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>Join the community emergency response</p>
        
        <form onSubmit={handleRegister}>
          <input 
            type="text" 
            placeholder="Full Name" 
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />
          <input 
            type="email" 
            placeholder="Email Address (Optional)" 
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="tel" 
              placeholder="Phone Number" 
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={otpVerified}
              style={{ flex: 1, margin: 0 }}
            />
            {otpVerified ? (
              <div style={{ width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#10b981', borderRadius: '12px', color: 'white' }}>
                 <CheckCircle size={20} />
              </div>
            ) : (
              <button type="button" onClick={handleSimulateOTP} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '0 1rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Verify
              </button>
            )}
          </div>

          <select 
            className="input-field" 
            value={preferredTime} 
            onChange={(e) => setPreferredTime(e.target.value)}
            style={{ marginBottom: '1rem' }}
          >
            <option value="Both">Available Any Time</option>
            <option value="Day">Day Only</option>
            <option value="Night">Night Only</option>
          </select>

          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '1.5rem' }}
          />
          
          <div style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', gap: '0.5rem' }}>
             <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} id="consent" required />
             <label htmlFor="consent" style={{ cursor: 'pointer', lineHeight: '1.2' }}>I consent to receiving emergency push alerts and sharing my location when assisting.</label>
          </div>

          <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>Become a Volunteer</button>
        </form>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Already a volunteer? <Link to="/volunteer/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default VolunteerRegister;
