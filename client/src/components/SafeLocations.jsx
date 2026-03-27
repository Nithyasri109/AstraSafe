import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const SafeLocations = () => {
  const [position, setPosition] = useState([11.0168, 76.9558]); 
  const [filter, setFilter] = useState('All');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'Police', 'Hospital', 'Crowded'];

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
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="police"](around:${radius},${lat},${lng});
        node["shop"="mall"](around:${radius},${lat},${lng});
        node["amenity"="marketplace"](around:${radius},${lat},${lng});
        node["public_transport"="station"](around:${radius},${lat},${lng});
      );
      out body;
    `;
    
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      const parsed = data.elements.map((el, i) => {
        const isHospital = el.tags.amenity === 'hospital';
        const isPolice = el.tags.amenity === 'police';
        let type = 'Crowded';
        let name = el.tags.name || 'Public Space';
        let icon = Users;
        let color = '#f59e0b'; // amber
        let bgColor = '#fef3c7';
        let markerColor = 'orange';

        if (isHospital) {
          type = 'Hospital';
          name = el.tags.name || 'General Hospital';
          icon = HeartPulse;
          color = '#ef4444';
          bgColor = '#fee2e2';
          markerColor = 'red';
        } else if (isPolice) {
          type = 'Police';
          name = el.tags.name || 'Police Station';
          icon = ShieldAlert;
          color = '#3b82f6';
          bgColor = '#dbeafe';
          markerColor = 'blue';
        }

        const distFloat = getDistance(lat, lng, el.lat, el.lon);
        const distanceDisplay = distFloat < 1 ? `${Math.round(distFloat * 1000)} m` : `${distFloat.toFixed(2)} km`;
        
        return {
          id: el.id,
          type,
          lat: el.lat,
          lng: el.lon,
          name,
          address: el.tags['addr:full'] || el.tags['addr:street'] || 'Local City Area',
          phone: el.tags.contact?.phone || el.tags.phone || '',
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
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={customMarker}><Popup>You</Popup></Marker>
          {!loading && locations.map(loc => {
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
        </MapContainer>
      </div>

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
