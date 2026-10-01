import { useState } from 'react';

export default function AddMember() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    try {
      const response = await fetch('http://localhost:8080/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Member successfully added to MySQL!");
        setFormData({ name: '', email: '', phone: '' }); // Clear the form
      } else {
        alert("Failed to add member.");
      }
    } catch (error) {
      console.error("API Integration Error:", error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Register New Member</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Name" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required 
        />
        <input 
          type="tel" 
          placeholder="Phone Number" 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required 
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          Add Member
        </button>
      </form>
    </div>
  );
}