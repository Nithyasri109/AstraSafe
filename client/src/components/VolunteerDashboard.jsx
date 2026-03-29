import React, { useState, useEffect, useRef } from 'react';
import { LogOut, MapPin, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const VolunteerDashboard = ({ setAuth }) => {
  const [profile, setProfile] = useState(null);
  const [position, setPosition] = useState([11.0168, 76.9558]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [incomingSOS, setIncomingSOS] = useState(null); // the alert data
  const [acceptedSOS, setAcceptedSOS] = useState(null); // active SOS being handled
  
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Audio for alerting
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audioRef.current.loop = true;

    const loadData = async () => {
      try {
        const res = await fetch('/api/volunteer/data', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
          setIsAvailable(data.isAvailable);
          
          if (data.location && data.location.coordinates) {
             setPosition([data.location.coordinates[1], data.location.coordinates[0]]);
          }

          // Initialize socket
          socketRef.current = io();
          
          // Re-join the volunteer room every time the socket connects/reconnects.
          socketRef.current.on('connect', () => {
            console.log('Socket Reconnected: Joining volunteer room.');
            socketRef.current.emit('volunteer_join', { volunteerId: data._id });
          });
          
          if (socketRef.current.connected) {
             socketRef.current.emit('volunteer_join', { volunteerId: data._id });
          }

          socketRef.current.on('volunteer_sos_alert', (sosData) => {
            // Wait, we got an alert!
            setIncomingSOS(sosData);
            if(audioRef.current) audioRef.current.play().catch(e => console.log(e));
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    loadData();

    // Setup GPS
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(async (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        
        // Sync location/status with server to stay active and discoverable
        try {
          await fetch('/api/volunteer/status', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ lat: newPos[0], lng: newPos[1] })
          });
        } catch (err) { }
      }, (err) => {}, { enableHighAccuracy: true });
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (socketRef.current) socketRef.current.disconnect();
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const toggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      await fetch('/api/volunteer/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ isAvailable: newStatus })
      });
    } catch(err) {
      console.error(err);
      setIsAvailable(!newStatus); // revert
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    setAuth(false);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2-lat1) * Math.PI / 180;
    const dLon = (lon2-lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const acceptSOS = () => {
    if(audioRef.current) audioRef.current.pause();
    setAcceptedSOS(incomingSOS);
    setIncomingSOS(null);
    socketRef.current.emit('accept_sos', { 
       volunteerId: profile?._id, 
       volunteerName: profile?.name, 
       userId: incomingSOS.userId,
       lat: position[0],
       lng: position[1]
    });
  };

  const ignoreSOS = () => {
    if(audioRef.current) audioRef.current.pause();
    setIncomingSOS(null);
  };

  const stopActiveSOS = () => {
     setAcceptedSOS(null);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex-row justify-between w-full" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Volunteer Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AstraSafe Emergency Response</p>
        </div>
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <LogOut size={24} />
        </button>
      </div>

      <div style={{ background: 'var(--foreground)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Hey, {profile?.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You are currently <strong style={{ color: isAvailable ? '#10b981' : '#64748b' }}>{isAvailable ? 'ACTIVE' : 'INACTIVE'}</strong></p>
          </div>
          <button 
            onClick={toggleAvailability} 
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '24px', 
              border: 'none', 
              background: isAvailable ? '#fee2e2' : '#dcfce7', 
              color: isAvailable ? '#ef4444' : '#10b981', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            {isAvailable ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {acceptedSOS && (
        <div style={{ background: '#fef2f2', border: '2px solid #ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#ef4444' }}>
               <ShieldAlert size={24} />
               <strong>Active Emergency!</strong>
             </div>
             <button onClick={stopActiveSOS} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>End Assistance</button>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Distance: {calculateDistance(position[0], position[1], acceptedSOS.lat, acceptedSOS.lng)} km away</p>
          <a href={`https://maps.google.com/?q=${acceptedSOS.lat},${acceptedSOS.lng}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', color: '#2563eb', fontWeight: 'bold' }}>Navigate via Google Maps</a>
        </div>
      )}

      {/* Map */}
      <div style={{ flexShrink: 0, height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={position} zoom={acceptedSOS ? 15 : 14} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <Marker position={position}>
            <Popup>You are here</Popup>
          </Marker>

          {acceptedSOS && (
            <>
              <Marker position={[acceptedSOS.lat, acceptedSOS.lng]} icon={redIcon}>
                 <Popup>Victim Location</Popup>
              </Marker>
              <Polyline positions={[position, [acceptedSOS.lat, acceptedSOS.lng]]} color="red" dashArray="5, 10" />
            </>
          )}

        </MapContainer>
      </div>

      {/* Incoming SOS Modal */}
      {incomingSOS && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', textAlign: 'center', animation: 'zoomIn 0.3s' }}>
            <div className="sos-wave" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', border: 'none', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
               <ShieldAlert size={40} color="white" />
            </div>
            <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>EMERGENCY NEARBY</h2>
            <p style={{ marginBottom: '1.5rem', color: '#475569' }}>
              Someone approximately {calculateDistance(position[0], position[1], incomingSOS.lat, incomingSOS.lng)} km away needs urgent help!
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-outline" onClick={ignoreSOS} style={{ flex: 1, borderColor: '#cbd5e1', color: '#64748b' }}>Ignore</button>
              <button className="btn-primary" onClick={acceptSOS} style={{ flex: 1, background: '#ef4444' }}>Accept & Help</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VolunteerDashboard;
