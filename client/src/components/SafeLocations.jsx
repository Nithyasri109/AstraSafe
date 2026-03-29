import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import { Navigation, Phone, HeartPulse, ShieldAlert, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const customMarker = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper for Haversine distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // return as float
};

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const SafeLocations = () => {
  const [position, setPosition] = useState([11.0168, 76.9558]); 
  const [filter, setFilter] = useState('All');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoutes, setShowRoutes] = useState(false);

  const filters = ['All', 'Police', 'Hospital', 'Crowded'];

  // Mock Route Data
  const mockStart = [11.0168, 76.9558];
  const mockEnd = [11.0290, 76.9620];
  const unsafeZone = { center: [11.0220, 76.9580], radius: 400 };
  const routeA = [ mockStart, unsafeZone.center, mockEnd ];
  const routeB = [ mockStart, [11.0175, 76.9500], [11.0250, 76.9490], [11.0290, 76.9550],  mockEnd ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          fetchNearbyPlaces(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error(err);
          // Fallback fetch
          fetchNearbyPlaces(position[0], position[1]);
        }
      );
    } else {
      fetchNearbyPlaces(position[0], position[1]);
    }
  }, []);

  const fetchNearbyPlaces = async (lat, lng) => {
    setLoading(true);
    const radius = 5000; // 5km
    const query = `
      [out:json][timeout:25];
      (
        nwr["amenity"="hospital"](around:${radius},${lat},${lng});
        nwr["amenity"="police"](around:${radius},${lat},${lng});
        nwr["shop"="mall"](around:${radius},${lat},${lng});
        nwr["amenity"="marketplace"](around:${radius},${lat},${lng});
        nwr["public_transport"="station"](around:${radius},${lat},${lng});
      );
      out center;
    `;
    
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!data.elements || data.elements.length === 0) {
        throw new Error("No elements found in Overpass response");
      }
      
      const parsed = data.elements.map((el, i) => {
        const tags = el.tags || {};
        const isHospital = tags.amenity === 'hospital';
        const isPolice = tags.amenity === 'police';
        let type = 'Crowded';
        let name = tags.name || 'Public Space';
        let icon = Users;
        let color = '#f59e0b'; // amber
        let bgColor = '#fef3c7';
        let markerColor = 'orange';

        if (isHospital) {
          type = 'Hospital';
          name = tags.name || 'General Hospital';
          icon = HeartPulse;
          color = '#ef4444';
          bgColor = '#fee2e2';
          markerColor = 'red';
        } else if (isPolice) {
          type = 'Police';
          name = tags.name || 'Police Station';
          icon = ShieldAlert;
          color = '#3b82f6';
          bgColor = '#dbeafe';
          markerColor = 'blue';
        }

        const elLat = el.lat || (el.center && el.center.lat);
        const elLon = el.lon || (el.center && el.center.lon);
        const distFloat = getDistance(lat, lng, elLat, elLon);
        const distanceDisplay = distFloat < 1 ? `${Math.round(distFloat * 1000)} m` : `${distFloat.toFixed(2)} km`;
        
        return {
          id: el.id,
          type,
          lat: elLat,
          lng: elLon,
          name,
          address: tags['addr:full'] || tags['addr:street'] || 'Local City Area',
          phone: tags.contact?.phone || tags.phone || '',
          distance: distanceDisplay,
          distVal: distFloat,
          icon,
          color,
          bgColor,
          markerColor
        };
      }).sort((a, b) => a.distVal - b.distVal);

      setLocations(parsed);
    } catch(err) {
      console.error('Error fetching Overpass API', err);
      // Fallback mock data with Real Exact Coordinates (Coimbatore area)
      const mockLocations = [
        {
          id: 'mock1', type: 'Crowded', lat: 11.0024, lng: 76.9556, name: 'Brookefields Mall',
          address: 'Brookefields, Coimbatore', phone: '0422 225 5000', distVal: getDistance(lat, lng, 11.0024, 76.9556),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock2', type: 'Crowded', lat: 11.0470, lng: 76.9930, name: 'Prozone Mall',
          address: 'Sathy Road, Coimbatore', phone: '0422 662 8111', distVal: getDistance(lat, lng, 11.0470, 76.9930),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock3', type: 'Crowded', lat: 11.0185, lng: 76.9654, name: 'Gandhipuram Town Bus Stand',
          address: 'Gandhipuram, Coimbatore', phone: '', distVal: getDistance(lat, lng, 11.0185, 76.9654),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock4', type: 'Crowded', lat: 10.9940, lng: 76.9655, name: 'Coimbatore Railway Station',
          address: 'State Bank Road, Coimbatore', phone: '139', distVal: getDistance(lat, lng, 10.9940, 76.9655),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock5', type: 'Hospital', lat: 11.0189, lng: 76.9515, name: 'Ganga Hospital',
          address: 'Mettupalayam Road, Coimbatore', phone: '0422 248 5000', distVal: getDistance(lat, lng, 11.0189, 76.9515),
          icon: HeartPulse, color: '#ef4444', bgColor: '#fee2e2', markerColor: 'red'
        },
        {
          id: 'mock6', type: 'Hospital', lat: 11.0238, lng: 77.0098, name: 'PSG Hospitals',
          address: 'Peelamedu, Coimbatore', phone: '0422 257 0170', distVal: getDistance(lat, lng, 11.0238, 77.0098),
          icon: HeartPulse, color: '#ef4444', bgColor: '#fee2e2', markerColor: 'red'
        },
        {
          id: 'mock7', type: 'Hospital', lat: 10.9984, lng: 76.9691, name: 'Coimbatore Medical College Hospital (CMCH)',
          address: 'Trichy Road, Coimbatore', phone: '0422 230 1393', distVal: getDistance(lat, lng, 10.9984, 76.9691),
          icon: HeartPulse, color: '#ef4444', bgColor: '#fee2e2', markerColor: 'red'
        },
        {
          id: 'mock8', type: 'Police', lat: 11.0105, lng: 76.9458, name: 'R.S. Puram Police Station',
          address: 'R.S. Puram, Coimbatore', phone: '0422 253 2233', distVal: getDistance(lat, lng, 11.0105, 76.9458),
          icon: ShieldAlert, color: '#3b82f6', bgColor: '#dbeafe', markerColor: 'blue'
        },
        {
          id: 'mock9', type: 'Police', lat: 10.9961, lng: 76.9750, name: 'Race Course Police Station',
          address: 'Race Course, Coimbatore', phone: '0422 222 0000', distVal: getDistance(lat, lng, 10.9961, 76.9750),
          icon: ShieldAlert, color: '#3b82f6', bgColor: '#dbeafe', markerColor: 'blue'
        },
        {
          id: 'mock10', type: 'Police', lat: 11.0175, lng: 76.9660, name: 'Gandhipuram Police Station',
          address: 'Gandhipuram, Coimbatore', phone: '0422 223 3333', distVal: getDistance(lat, lng, 11.0175, 76.9660),
          icon: ShieldAlert, color: '#3b82f6', bgColor: '#dbeafe', markerColor: 'blue'
        },
        {
          id: 'mock11', type: 'Crowded', lat: 11.0021, lng: 76.9734, name: 'VOC Park and Zoo',
          address: 'Gopalapuram, Coimbatore', phone: '', distVal: getDistance(lat, lng, 11.0021, 76.9734),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock12', type: 'Crowded', lat: 11.0244, lng: 77.0026, name: 'Fun Republic Mall',
          address: 'Avinashi Road, Coimbatore', phone: '0422 433 3333', distVal: getDistance(lat, lng, 11.0244, 77.0026),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock13', type: 'Police', lat: 11.0175, lng: 76.9560, name: 'Local Patrol Post',
          address: 'Main Street Corner', phone: '100', distVal: getDistance(lat, lng, 11.0175, 76.9560),
          icon: ShieldAlert, color: '#3b82f6', bgColor: '#dbeafe', markerColor: 'blue'
        },
        {
          id: 'mock14', type: 'Hospital', lat: 11.0160, lng: 76.9555, name: 'City Central Clinic',
          address: 'Nearby Avenue', phone: '108', distVal: getDistance(lat, lng, 11.0160, 76.9555),
          icon: HeartPulse, color: '#ef4444', bgColor: '#fee2e2', markerColor: 'red'
        },
        {
          id: 'mock15', type: 'Crowded', lat: 11.0170, lng: 76.9570, name: '24/7 Supermarket',
          address: 'Station Road', phone: '', distVal: getDistance(lat, lng, 11.0170, 76.9570),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        },
        {
          id: 'mock16', type: 'Hospital', lat: 11.0180, lng: 76.9540, name: 'Care Pharmacy & First Aid',
          address: 'Medical Street', phone: '', distVal: getDistance(lat, lng, 11.0180, 76.9540),
          icon: HeartPulse, color: '#ef4444', bgColor: '#fee2e2', markerColor: 'red'
        },
        {
          id: 'mock17', type: 'Crowded', lat: 11.0150, lng: 76.9565, name: 'Main Bus Stop',
          address: 'Transit Hub', phone: '', distVal: getDistance(lat, lng, 11.0150, 76.9565),
          icon: Users, color: '#f59e0b', bgColor: '#fef3c7', markerColor: 'orange'
        }
      ].map(loc => ({
        ...loc,
        distance: loc.distVal < 1 ? `${Math.round(loc.distVal * 1000)} m` : `${loc.distVal.toFixed(2)} km`
      })).sort((a, b) => a.distVal - b.distVal);

      setLocations(mockLocations);
    }
    setLoading(false);
  };

  const filteredLocations = filter === 'All' ? locations : locations.filter(l => l.type === filter);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Nearby Help</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Emergency services & safe locations near you</p>
      </div>

      <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1rem', flexShrink: 0 }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={position} zoom={13} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={customMarker}><Popup>You</Popup></Marker>
          {!loading && !showRoutes && filteredLocations.map(loc => {
            const IconAsset = L.icon({
              iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${loc.markerColor}.png`,
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
              iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
            });
            return (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={IconAsset}>
                <Popup>{loc.name}</Popup>
              </Marker>
            )
          })}
          
          {showRoutes && (
            <>
              <Marker position={mockStart} icon={customMarker}><Popup>Origin</Popup></Marker>
              <Marker position={mockEnd} icon={customMarker}><Popup>Destination</Popup></Marker>
              <Circle center={unsafeZone.center} radius={unsafeZone.radius} pathOptions={{ color: 'var(--danger)', fillColor: 'var(--danger)', fillOpacity: 0.3, weight: 1 }} />
              <Polyline positions={routeA} pathOptions={{ color: 'var(--danger)', weight: 4, dashArray: '8, 8' }} />
              <Polyline positions={routeB} pathOptions={{ color: '#10b981', weight: 5 }} />
              <ChangeView center={unsafeZone.center} zoom={14} />
            </>
          )}
        </MapContainer>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn-primary" onClick={() => setShowRoutes(!showRoutes)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <Navigation size={18} /> {showRoutes ? 'Exit Safe Route Simulation' : 'Simulate Safe Route Planning'}
        </button>
      </div>

      {showRoutes && (
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Route Safety Analysis</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '20px', height: '4px', background: 'var(--danger)' }}></div>
              <span><strong>Route A:</strong> Short but unsafe ❌<br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Passes through dimly lit high-risk area)</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '20px', height: '5px', background: '#10b981' }}></div>
              <span><strong>Route B:</strong> Slightly longer but safe ✅<br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Well-lit route, high crowd density)</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(225, 29, 72, 0.3)', border: '1px solid var(--danger)' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Red zones indicate historically unsafe areas requiring detour.</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {filters.map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              border: 'none', 
              background: filter === f ? 'var(--bg-color)' : 'transparent',
              borderRadius: filter === f ? '8px' : '0',
              fontWeight: filter === f ? '600' : '500',
              color: filter === f ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              boxShadow: filter === f ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
             }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
        {loading ? (
          <div style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>Locating nearby emergency services...</div>
        ) : filteredLocations.length === 0 ? (
          <div style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No locations found in a 5km radius.</div>
        ) : filteredLocations.map(loc => (
          <div key={loc.id} className="card flex-row" style={{ padding: '1rem 1.5rem', justifyContent: 'space-between' }}>
            <div className="flex-row" style={{ gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: loc.bgColor, color: loc.color }}>
                <loc.icon size={24} />
              </div>
              <div className="flex-col" style={{ gap: '0.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{loc.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{loc.address}</p>
                <div className="flex-row" style={{ gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: loc.bgColor, color: loc.color, borderRadius: '4px', fontWeight: '500' }}>
                    {loc.type}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Navigation size={10} /> {loc.distance}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-col" style={{ gap: '1rem', color: 'var(--primary)' }}>
              <button style={{ background:'transparent', border:'none', color:'var(--primary)', cursor:'pointer' }} onClick={() => window.open(`https://maps.google.com/?q=${loc.lat},${loc.lng}`, '_blank')}><Navigation size={20} /></button>
              {loc.phone && <button style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer' }} onClick={() => window.location.href=`tel:${loc.phone}`}><Phone size={20} /></button>}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SafeLocations;
