import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [name, setName] = useState('Гость ' + Math.floor(Math.random() * 1000));
  const navigate = useNavigate();

  const createRoom = async () => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const room = await res.json();
    localStorage.setItem('userName', name);
    navigate('/room/' + room.id);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '32px' }}>
          🎬 SyncWatch
        </h1>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ваше имя"
          style={{
            width: '100%',
            padding: '14px',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: '8px',
            color: '#fff',
            marginBottom: '16px',
            fontSize: '16px'
          }}
        />
        <button
          onClick={createRoom}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Создать комнату
        </button>
      </div>
    </div>
  );
}
