import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Map, PhoneCall, MessageCircle, Settings, Shield, Wifi, WifiOff, MapPin, CheckCircle, Navigation, Share2, Mic, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const volunteerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [volunteerHelper, setVolunteerHelper] = useState(null);

  const socketRef = useRef(null);
  const userProfileRef = useRef(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await fetch('/api/user/data', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) {
          userProfileRef.current = data;
          if (data.trustedContacts) setContacts(data.trustedContacts);
          if (data.emergencyNumber) setEmergencyNumber(data.emergencyNumber);
          if (data.lastLocation && data.lastLocation.lat) {
            setPosition([data.lastLocation.lat, data.lastLocation.lng]);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };
    loadUserData();

    const handleOffline = () => {
      setIsOffline(true);
      alert("Internet connection lost. SOS will operate offline.");
    };
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Setup Socket
    socketRef.current = io();
    socketRef.current.on('sos_accepted', (data) => {
       if (userProfileRef.current && data.userId === userProfileRef.current._id) {
          setVolunteerHelper(data);
       }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        try {
          await fetch('/api/user/location', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ lat: newPos[0], lng: newPos[1] })
          });
          
          fetch(`/api/volunteer/nearby?lat=${newPos[0]}&lng=${newPos[1]}`)
            .then(res => res.json())
            .then(data => Array.isArray(data) && setNearbyVolunteers(data))
            .catch(e => console.error(e));

        } catch (err) {
          console.error('Sync GPS error', err);
        }
      }, (err) => {
        console.warn("GPS access denied or unavailable", err);
      }, { enableHighAccuracy: true });
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (socketRef.current) socketRef.current.disconnect();
      stopSiren();
    };
  }, []);

  // Voice Command Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase();
        
        if (transcript.includes('help') || transcript.includes('sos')) {
          console.log('Voice command detected:', transcript);
          window.dispatchEvent(new CustomEvent('voice-sos'));
        }
      };

      recognition.onerror = (event) => {
        console.log("Speech recognition error", event.error);
      };

      recognition.onend = () => {
        if (recognition) {
          try { recognition.start(); } catch(e) {}
        }
      };

      try {
        recognition.start();
      } catch (err) {
        console.error("Speech recognition start error", err);
      }
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        try { recognition.stop(); } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    const handleVoiceSOS = () => {
      if (!sosActive) {
        triggerSOS();
      }
    };
    window.addEventListener('voice-sos', handleVoiceSOS);
    return () => window.removeEventListener('voice-sos', handleVoiceSOS);
  });

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
      
      // Stop Media (Audio/Video) Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } else {
      setSosActive(true);
      startSiren();
      document.body.classList.add('flash-screen');
      triggerSMSFlow();

      // Emit SOS to Socket
      if (socketRef.current && !isOffline) {
         socketRef.current.emit('trigger_sos', {
            lat: position[0],
            lng: position[1],
            userId: userProfileRef.current?._id || 'unknown_user_id',
            name: userProfileRef.current?.name || 'AstraSafe User',
            phone: userProfileRef.current?.phone || 'Unknown Phone'
         });
      }

      // Start Audio and Camera Recording silently (background)
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "environment" } });
        } catch (videoErr) {
          // Fallback to any available camera if back camera is unavailable
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        }

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const mediaBlob = new Blob(audioChunksRef.current, { type: 'video/webm' });
          const mediaUrl = URL.createObjectURL(mediaBlob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = mediaUrl;
          a.download = `SOS_Emergency_Recording_${new Date().toISOString().replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(mediaUrl);
          document.body.removeChild(a);
        };

        mediaRecorder.start();
        console.log("SOS Camera and Audio Recording started...");
      } catch (err) {
        console.error("Camera/Microphone access denied or unavailable", err);
      }
    }
  };

  const triggerSMSFlow = async () => {
    const timestamp = new Date().toLocaleString();
    const locInfo = `https://maps.google.com/?q=${position[0]},${position[1]}`;
    const emergencyMessage = `EMERGENCY! I am in danger. Location: ${locInfo} (Time: ${timestamp})`;

    const handleNativeFallback = () => {
      if (contacts.length > 0) {
        const phoneNumbers = contacts.map(c => c.phone.replace(/[^0-9]/g, '')).join(',');
        const encodedMsg = encodeURIComponent(emergencyMessage);
        
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        let smsUri = `sms:${phoneNumbers}?body=${encodedMsg}`;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
          smsUri = `sms:${phoneNumbers}&body=${encodedMsg}`;
        }
        
        window.open(smsUri, '_self');
      } else {
        alert("No trusted contacts to send offline SMS.");
      }
    };

    if (!isOffline) {
      // Online: Open the WhatsApp universal share link
      if (contacts.length > 0) {
        // WhatsApp strictly prohibits sending to multiple numbers simultaneously via URL parameters.
        // Opening the base wa.me URL with text triggers WhatsApp's native multi-contact picker
        // allowing the user to select ALL trusted contacts and send to them simultaneously from one page.
        window.open(`https://wa.me/?text=${encodeURIComponent(emergencyMessage)}`, '_blank');
      } else {
        alert("No trusted contacts to send WhatsApp message to.");
      }
    } else {
      // Offline: Open native SMS 
      console.log('Offline. Triggering native SMS fallback.');
      handleNativeFallback();
    }

    try {
      // Fetch existing alerts first from API
      const res = await fetch('/api/user/data', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await res.json();
      const existingAlerts = data.alerts || [];
      
      existingAlerts.push({
        timestamp: new Date().toISOString(),
        locationUrl: locInfo,
        contactsCount: contacts.length
      });
      
      await fetch('/api/user/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ alerts: existingAlerts })
      });
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>AstraSafe</h1>
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
        <div className={`status-item ${!isOffline ? 'active' : ''}`} style={isOffline ? {color: '#dc2626'} : {}}>
          {!isOffline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{!isOffline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="status-item active">
          <MapPin size={16} />
          <span>GPS Active</span>
        </div>
        <div className="status-item active">
          <Shield size={16} />
          <span>Protected</span>
        </div>
        <div className="status-item active">
          <Mic size={16} />
          <span>Voice</span>
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

      {volunteerHelper && (
        <div style={{ background: '#dcfce7', border: '2px solid #10b981', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', animation: 'zoomIn 0.3s' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#10b981' }}>
            <CheckCircle size={24} />
            <strong>Help is on the way!</strong>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#064e3b' }}>
            Volunteer <strong>{volunteerHelper.volunteerName}</strong> has accepted your SOS and is heading to your location.
          </p>
        </div>
      )}

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
      <div style={{ padding: '0 0 1rem 0' }}>
         <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Active Volunteers Nearby ({nearbyVolunteers.length})</h3>
      </div>
      <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1rem' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={true}>
          <ChangeView center={position} zoom={13} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position}>
             <Popup>You are here</Popup>
          </Marker>
          
          {nearbyVolunteers.map(v => (
             <Marker key={v._id} position={[v.location.coordinates[1], v.location.coordinates[0]]} icon={volunteerIcon}>
                 <Popup>
                    <strong>{v.name}</strong><br />
                    Status: Active<br />
                    Distance: {calculateDistance(position[0], position[1], v.location.coordinates[1], v.location.coordinates[0])} km away
                 </Popup>
             </Marker>
          ))}

          {volunteerHelper && volunteerHelper.lat && volunteerHelper.lng && (
             <>
               <Marker position={[volunteerHelper.lat, volunteerHelper.lng]} icon={volunteerIcon}>
                  <Popup>Assigned Volunteer: {volunteerHelper.volunteerName}</Popup>
               </Marker>
               <Polyline positions={[position, [volunteerHelper.lat, volunteerHelper.lng]]} color="#10b981" dashArray="5, 10" weight={4} />
             </>
          )}
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
