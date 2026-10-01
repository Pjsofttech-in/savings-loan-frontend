import { useState, useEffect } from 'react';

export default function MemberList() {
  // This state holds the array of members from MySQL
  const [members, setMembers] = useState([]);

  // useEffect runs automatically when the component loads on the screen
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/members');
        const data = await response.json();
        setMembers(data); // Saves the database rows into React state
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchMembers();
  }, []); // The empty brackets [] mean "only run this once when the page loads"

  return (
    <div style={{ padding: '20px', maxWidth: '600px', marginTop: '20px' }}>
      <h2>Member Directory</h2>
      
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ padding: '8px' }}>ID</th>
            <th style={{ padding: '8px' }}>Name</th>
            <th style={{ padding: '8px' }}>Email</th>
            <th style={{ padding: '8px' }}>Phone</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '8px' }}>{member.id}</td>
              <td style={{ padding: '8px' }}>{member.name}</td>
              <td style={{ padding: '8px' }}>{member.email}</td>
              <td style={{ padding: '8px' }}>{member.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {members.length === 0 && <p>No members found in the database.</p>}
    </div>
  );
}