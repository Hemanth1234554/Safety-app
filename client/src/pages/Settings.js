// File: client/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [contacts, setContacts] = useState([]);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('PHONE');
  const [msg, setMsg] = useState('');

  // We get the user info from storage
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Load contacts when page opens
  useEffect(() => {
    if (userInfo) {
      axios.get(`https://ghost-backend-fq2h.onrender.com/api/user/contacts/${userInfo._id}`)
        .then(res => setContacts(res.data))
        .catch(err => console.log(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <--- The warning is now silenced here

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('https://ghost-backend-fq2h.onrender.com/api/user/contacts', {
        userId: userInfo._id,
        name: newName,
        type: newType,
        value: newValue
      });
      setContacts(data); // Update list
      setNewName(''); setNewValue('');
      setMsg('✅ CONTACT SECURED');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      setMsg('❌ FAILED TO SAVE');
    }
  };

  const handleDelete = async (contactId) => {
    try {
      const { data } = await axios.post('hhttps://ghost-backend-fq2h.onrender.com/api/user/contacts/delete', {
        userId: userInfo._id,
        contactId
      });
      setContacts(data);
    } catch (error) {
      console.error("Delete failed");
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '500px' }}>
      <h2>⚙️ COMMAND CENTER</h2>
      <p style={{ color: '#888', fontSize: '12px' }}>EMERGENCY CONTACT CONFIGURATION</p>

      {/* ADD CONTACT FORM */}
      <form onSubmit={handleAdd} style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
        <input className="spy-input" placeholder="NAME (e.g. HQ)" value={newName} onChange={e => setNewName(e.target.value)} required />

        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="spy-input" style={{ width: '40%' }} value={newType} onChange={e => setNewType(e.target.value)}>
            <option value="PHONE">PHONE</option>
            <option value="EMAIL">EMAIL</option>
          </select>
          <input className="spy-input" placeholder="NUMBER / EMAIL" value={newValue} onChange={e => setNewValue(e.target.value)} required />
        </div>

        <button type="submit" className="spy-btn btn-primary" style={{ padding: '10px' }}>ADD CONTACT</button>
        {msg && <p style={{ color: '#0f0', marginTop: '10px' }}>{msg}</p>}
      </form>

      {/* CONTACT LIST */}
      <div style={{ maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
        {contacts.map(c => (
          <div key={c._id} style={{ background: '#111', padding: '10px', marginBottom: '10px', borderLeft: '3px solid #0088ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#fff' }}>{c.name}</strong>
              <div style={{ fontSize: '12px', color: '#888' }}>{c.type}: {c.value}</div>
            </div>
            <button onClick={() => handleDelete(c._id)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', fontSize: '12px', width: 'auto', height: 'auto' }}>
              X
            </button>
          </div>
        ))}
        {contacts.length === 0 && <p style={{ color: '#555', textAlign: 'center' }}>NO CONTACTS ASSIGNED</p>}
      </div>
    </div>
  );
};

export default Settings;  