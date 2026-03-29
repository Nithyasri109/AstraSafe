import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Phone, User as UserIcon } from 'lucide-react';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/user/data', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (res.ok && data.trustedContacts) {
          setContacts(data.trustedContacts);
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };
    fetchContacts();
  }, []);

  const saveContacts = async (updatedContacts) => {
    try {
      setContacts(updatedContacts);
      await fetch('/api/user/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ contacts: updatedContacts })
      });
    } catch (err) {
      console.error('Error saving contacts:', err);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName && newPhone) {
      const updated = [...contacts, { id: Date.now(), name: newName, phone: newPhone }];
      saveContacts(updated);
      setNewName('');
      setNewPhone('');
    }
  };

  const handleRemove = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    saveContacts(updated);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Trusted Contacts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Add people who should receive your SOS alerts</p>
      </div>

      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Contact Name</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="E.g. Mom" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required 
            style={{ marginBottom: 0, marginTop: '0.5rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Phone Number</label>
          <input 
            type="tel" 
            className="input-field" 
            placeholder="+1 234 567 8900" 
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            required 
            style={{ marginBottom: 0, marginTop: '0.5rem' }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: '1.25rem', height: '42px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} /> Add
        </button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '12px', border: `1px dashed var(--border)` }}>
            <UsersIcon size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No trusted contacts added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contacts.map(c => (
              <div key={c.id} className="card flex-row justify-between" style={{ padding: '1rem 1.5rem' }}>
                <div className="flex-row" style={{ gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                    <UserIcon size={20} style={{ margin: 'auto' }} />
                  </div>
                  <div className="flex-col">
                    <span style={{ fontWeight: '600' }}>{c.name}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Phone size={12} /> {c.phone}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleRemove(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
import { Users as UsersIcon } from 'lucide-react';
export default Contacts;
