import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Users, MapPin, Bell, User, HeartPulse } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Shield size={24} />
      </div>
      
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Shield size={20} />
        <span>SOS</span>
      </NavLink>

      <NavLink 
        to="/contacts" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Users size={20} />
        <span>Contacts</span>
      </NavLink>

      <NavLink 
        to="/safe-places" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <MapPin size={20} />
        <span>Nearby</span>
      </NavLink>

      <NavLink 
        to="/alerts" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Bell size={20} />
        <span>Alerts</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>

      <div style={{ flex: 1 }}></div>

      <NavLink 
        to="/volunteer/dashboard" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        style={{ marginTop: 'auto', color: '#10b981' }}
      >
        <HeartPulse size={20} />
        <span>Volunteer</span>
      </NavLink>
    </div>
  );
};

export default Sidebar;
