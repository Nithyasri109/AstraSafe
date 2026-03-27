import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Users, MapPin, Bell, User } from 'lucide-react';

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
    </div>
  );
};

export default Sidebar;
