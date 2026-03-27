import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Map, PhoneCall, MessageCircle, Settings, Shield, Wifi, MapPin, CheckCircle, Navigation, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const Dashboard = ({ setAuth }) => {
  const [sosActive, setSosActive] = useState(false);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();
  const [position, setPosition] = useState([11.0168, 76.9558]); 
  const [contacts, setContacts] = useState([]);
  const [emergencyNumber, setEmergencyNumber] = useState('112');

  useEffect(() => {
    // Load contacts
    const saved = localStorage.getItem('smart_safety_contacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    }
    
    // Load profile to get emergency number
    const savedProfile = localStorage.getItem('smart_safety_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      if (parsedProfile.emergencyNumber) {
        setEmergencyNumber(parsedProfile.emergencyNumber);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }

    return () => {
      stopSiren();
    };
  }, []);

  const startSiren = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    
    let isHigh = false;
    sirenIntervalRef.current = setInterval(() => {
      isHigh = !isHigh;
      osc.frequency.setTargetAtTime(isHigh ? 800 : 400, ctx.currentTime, 0.1);
    }, 400);

    gainNode.gain.value = 1.0;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    oscillatorRef.current = osc;
  };

  const stopSiren = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
  };

  const triggerSOS = async () => {
    if (sosActive) {
      setSosActive(false);
      stopSiren();
      document.body.classList.remove('flash-screen');
      
      // Stop Audio Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } else {
      setSosActive(true);
      startSiren();
      document.body.classList.add('flash-screen');
      triggerSMSFlow();

      // Start Audio Recording silently
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = audioUrl;
          a.download = `SOS_Emergency_Audio_${new Date().toISOString().replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(audioUrl);
          document.body.removeChild(a);
        };

        mediaRecorder.start();
        console.log("SOS Audio Recording started...");
      } catch (err) {
        console.error("Microphone access denied or unavailable", err);
      }
    }
  };

  const triggerSMSFlow = async () => {
    const locInfo = `https://maps.google.com/?q=${position[0]},${position[1]}`;
    try {
      await fetch('http://localhost:5000/api/sos/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts, locationUrl: locInfo })
      });
      console.log('Backend simulated/auto-dispatch success.');
    } catch(err) {
      console.error('Auto dispatch failed', err);
    }

    // Native Fallback: Try to open WhatsApp with the trusted contact
    if (contacts.length > 0) {
      // WhatsApp only supports messaging one contact at a time via deep links
      const primaryContact = contacts[0].phone.replace(/[^0-9]/g, ''); 
      const message = encodeURIComponent(`EMERGENCY! I need help immediately. My location is: ${locInfo}`);
      
      // Attempt to open WhatsApp directly
      window.open(`https://wa.me/${primaryContact}?text=${message}`, '_blank');
    }

    // --- Record Alert in LocalStorage for Alert History ---
    try {
      const existingAlerts = JSON.parse(localStorage.getItem('smart_safety_alerts') || '[]');
      existingAlerts.push({
        timestamp: new Date().toISOString(),
        locationUrl: locInfo,
        contactsCount: contacts.length
      });
      localStorage.setItem('smart_safety_alerts', JSON.stringify(existingAlerts));
    } catch(e) {
      console.error("Failed to save alert history", e);
    }
  };

  const handleShareLocation = async () => {
    const locInfo = `https://maps.google.com/?q=${position[0]},${position[1]}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Live Location',
          text: 'Here is my current live location:',
          url: locInfo
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(`My location: ${locInfo}`);
      alert('Location link copied to clipboard!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex-row justify-between w-full" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Safety Network</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>You're protected</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Shield size={20} />
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar" style={{ borderRadius: '12px', marginBottom: '3rem' }}>
        <div className="status-item active">
          <Wifi size={16} />
          <span>Online</span>
        </div>
        <div className="status-item active">
          <MapPin size={16} />
          <span>GPS Active</span>
        </div>
        <div className="status-item active">
          <Shield size={16} />
          <span>Protected</span>
        </div>
      </div>

      {/* Central SOS Button */}
      <div className="sos-container">
        <div className="sos-button-wrapper">
          {/* Pulsating background waves */}
          <div className="sos-wave"></div>
          <div className="sos-wave"></div>
          
          <button 
            className="sos-button"
            onClick={triggerSOS}
            style={sosActive ? { background: '#dc2626' } : {}}
          >
            <Shield size={48} />
            <span>SOS</span>
            <small>{sosActive ? 'STOP' : 'Press & hold'}</small>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn-danger flex-row" style={{ justifyContent: 'center', padding: '1rem', gap: '0.5rem' }} onClick={() => window.location.href=`tel:${emergencyNumber}`}>
          <PhoneCall size={20} /> Call {emergencyNumber}
        </button>
        <button className="btn-warning flex-row" style={{ justifyContent: 'center', padding: '1rem', gap: '0.5rem' }} onClick={triggerSMSFlow}>
          <MessageCircle size={20} /> Send SMS
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-outline flex-row" style={{ justifyContent: 'center', padding: '1rem', gap: '0.5rem' }} onClick={handleShareLocation}>
          <Share2 size={18} /> Share Location
        </button>
        <button 
          className="btn-outline flex-row" 
          style={{ justifyContent: 'center', padding: '1rem', gap: '0.5rem' }}
          onClick={() => navigate('/safe-places')}
        >
          <MapPin size={18} /> Open Map
        </button>
      </div>

      {/* Map Preview */}
      <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1rem' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position}></Marker>
        </MapContainer>
      </div>

      {/* Footer Trusted Contacts */}
      <div className="flex-row" style={{ gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', marginRight: '0.5rem' }}>
          {contacts.slice(0, 3).map((c, i) => (
            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0px', textTransform: 'uppercase' }}>
              {c.name.charAt(0)}
            </div>
          ))}
          {contacts.length === 0 && (
             <div style={{ padding: '0.2rem 0.5rem', background: '#e2e8f0', borderRadius:'12px', fontSize:'11px' }}>No contacts added</div>
          )}
        </div>
        <span onClick={() => navigate('/contacts')} style={{cursor:'pointer'}}>{contacts.length} trusted contacts</span>
      </div>

    </div>
  );
};

export default Dashboard;
