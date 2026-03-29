import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Users, Activity } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/user/data', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok && data.alerts) {
          // Parse and sort by newest first
          const parsed = data.alerts;
          parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAlerts(parsed);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      }
    };
    fetchAlerts();
  }, []);

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your alert history?')) {
      try {
        await fetch('/api/user/alerts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify({ alerts: [] })
        });
        setAlerts([]);
      } catch (err) {
        console.error('Error clearing alerts:', err);
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Alert History</h1>
          <p style={{ color: 'var(--text-muted)' }}>Timeline of your past SOS activations</p>
        </div>
        {alerts.length > 0 && (
          <button onClick={clearHistory} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            Clear History
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--border)' }}>
              <Activity size={32} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>No alerts recorded</h3>
            <p>You have never activated the SOS button.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map((alert, idx) => {
              const dateObj = new Date(alert.timestamp);
              const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={idx} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: '600' }}>
                      <AlertTriangle size={20} />
                      Emergency SOS Triggered
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <Clock size={16} />
                      {dateStr} at {timeStr}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alert.locationUrl && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <MapPin size={18} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Location Captured</p>
                          <a href={alert.locationUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
                            View on Google Maps
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Users size={18} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Notified {alert.contactsCount} Contact(s)</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Emergency dispatch simulation initiated.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
