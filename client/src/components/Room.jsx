import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function Room() {
  const { roomId } = useParams();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [participants, setParticipants] = useState([]);
  const userName = localStorage.getItem('userName') || 'Гость';

  useEffect(() => {
    const s = io('http://localhost:3001');
    setSocket(s);

    s.emit('join-room', {
      roomId,
      name: userName,
      avatar: '👤'
    });

    s.on('room-state', data => {
      setParticipants(data.participants);
      if (data.currentVideo) loadYouTube(data.currentVideo);
    });

    s.on('user-joined', data => {
      setParticipants(data.participants);
      setMessages(m => [...m, { user: 'Система', text: data.user.name + ' присоединился' }]);
    });

    s.on('video-changed', data => {
      loadYouTube(data.videoUrl);
    });

    s.on('chat-message', msg => {
      setMessages(m => [...m, { user: msg.userName, text: msg.message }]);
    });

    return () => s.close();
  }, [roomId]);

  const loadYouTube = (url) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!id) return;

    const player = document.getElementById('player');
    player.innerHTML = '<div id="yt"></div>';

    new window.YT.Player('yt', {
      videoId: id,
      width: '100%',
      height: '100%'
    });
  };

  const send = () => {
    if (!input.trim()) return;
    socket?.emit('chat-message', {
      roomId,
      userName,
      message: input
    });
    setInput('');
  };

  const changeVideo = () => {
    if (!videoUrl.trim()) return;
    socket?.emit('change-video', {
      roomId,
      videoUrl,
      videoType: 'youtube'
    });
    setVideoUrl('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        background: '#1a1a1a',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h1>🎬 SyncWatch</h1>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <input
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="YouTube ссылка"
            style={{
              flex: 1,
              padding: '10px',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <button
            onClick={changeVideo}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Загрузить
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Ссылка скопирована!');
            }}
            style={{
              padding: '10px 20px',
              background: '#2a2a2a',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Поделиться
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        <div>
          <div id="player" style={{
            background: '#000',
            borderRadius: '12px',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            Ожидание видео...
          </div>

          <div style={{
            background: '#1a1a1a',
            padding: '16px',
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <h3>👥 Участники ({participants.length})</h3>
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {participants.map(p => (
                <div key={p.id} style={{
                  padding: '8px 12px',
                  background: '#2a2a2a',
                  borderRadius: '8px'
                }}>
                  {p.avatar} {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          height: '600px'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #2a2a2a' }}>
            <h3>💬 Чат</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  {m.user}
                </div>
                <div style={{
                  background: '#2a2a2a',
                  padding: '8px 12px',
                  borderRadius: '8px'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            padding: '16px',
            borderTop: '1px solid #2a2a2a',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && send()}
              placeholder="Сообщение..."
              style={{
                flex: 1,
                padding: '10px',
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <button
              onClick={send}
              style={{
                padding: '10px 20px',
                background: '#667eea',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
