// File: client/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const [contacts, setContacts] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const userId = userInfo ? userInfo._id : null;

    useEffect(() => {
        if (userId) fetchContacts();
        // eslint-disable-next-line
    }, [userId]);

    const fetchContacts = async () => {
        try {
            // Updated to point to Render
            const res = await axios.get(`https://ghost-backend-fq2h.onrender.com/api/users/contacts?userId=${userId}`);
            setContacts(res.data);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name || !phone) return;
        setLoading(true);
        try {
            const res = await axios.post('https://ghost-backend-fq2h.onrender.com/api/users/contacts', {
                userId,
                name,
                phone // Assuming SMS type for now
            });
            setContacts(res.data);
            setName('');
            setPhone('');
        } catch (error) {
            alert("Failed to add contact");
        }
        setLoading(false);
    };

    // <--- THIS IS THE DELETE FUNCTION YOU WANTED
    const handleDelete = async (contactId) => {
        if(!window.confirm("Delete this contact?")) return;

        try {
            // Note: In DELETE requests, body data goes inside the 'data' property
            const res = await axios.delete(`https://ghost-backend-fq2h.onrender.com/api/users/contacts/${contactId}`, {
                data: { userId } 
            });
            setContacts(res.data); // Update list with the fresh data from server
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Could not delete contact.");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>SETTINGS & CONTACTS</div>
            
            {/* ADD CONTACT FORM */}
            <form onSubmit={handleAdd} style={styles.form}>
                <input 
                    type="text" 
                    placeholder="Name (e.g., Mom)" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                />
                <input 
                    type="tel" 
                    placeholder="Phone / Email" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={styles.input}
                />
                <button type="submit" disabled={loading} style={styles.addBtn}>
                    {loading ? "SAVING..." : "ADD CONTACT"}
                </button>
            </form>

            {/* CONTACT LIST */}
            <div style={styles.list}>
                {contacts.map((c) => (
                    <div key={c._id} style={styles.card}>
                        <div style={styles.info}>
                            <div style={styles.name}>{c.name}</div>
                            <div style={styles.detail}>{c.value}</div>
                        </div>
                        {/* THE DELETE BUTTON (Red Cross) */}
                        <button onClick={() => handleDelete(c._id)} style={styles.deleteBtn}>
                            ❌
                        </button>
                    </div>
                ))}
                {contacts.length === 0 && <p style={{color:'#666', marginTop: '20px'}}>No contacts yet.</p>}
            </div>

            <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                BACK TO DASHBOARD
            </button>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#000', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    header: { color: '#00ff00', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', letterSpacing: '2px' },
    form: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' },
    input: { padding: '15px', borderRadius: '5px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '16px' },
    addBtn: { padding: '15px', background: '#0088ff', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    list: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' },
    card: { background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    info: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
    name: { fontSize: '16px', fontWeight: 'bold', color: '#fff' },
    detail: { fontSize: '12px', color: '#888' },
    deleteBtn: { background: 'transparent', border: 'none', fontSize: '14px', cursor: 'pointer', padding: '5px 10px' },
    backBtn: { marginTop: '30px', background: '#333', color: '#fff', padding: '10px 20px', borderRadius: '5px', border: 'none' }
};

export default Settings;