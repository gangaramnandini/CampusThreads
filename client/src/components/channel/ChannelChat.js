import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../contexts/auth-context';

const ChannelChat = ({ channelId }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    setError('');
    if (!token || !channelId) {
      setMessages([]);
      setLoading(false);
      setError('Missing channel or login.');
      return;
    }
    setLoading(true);
    axios
      .get(`/api/channel/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => {
        setMessages([]);
        setError('Failed to fetch messages.');
        console.error('Failed to fetch messages:', err);
      })
      .finally(() => setLoading(false));
  }, [channelId, token]);

  const sendMessage = (e) => {
    e.preventDefault();
    setError('');
    if (!content.trim()) return;
    if (!token || !channelId) {
      setError('Missing channel or login.');
      return;
    }
    axios
      .post(
        `/api/channel/${channelId}/message`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => setMessages((prev) => [...prev, res.data]))
      .catch((err) => {
        setError('Failed to send message.');
        console.error('Failed to send message:', err);
      });
    setContent('');
  };

  return (
    <div className="bg-[rgb(var(--surface)/1)] rounded-xl shadow-xl mb-6 flex flex-col">
      <div className="px-6 pt-5 pb-3 text-xl font-semibold text-[rgb(var(--on-background)/1)]">
        Channel Chat
      </div>
      <div
        className="px-6 pb-2 flex-1"
        style={{ maxHeight: 350, overflowY: 'auto' }}
      >
        {loading && (
          <div className="text-[rgb(var(--on-surface)/1)]/70 py-4 text-center">
            Loading messages...
          </div>
        )}
        {!loading && error && (
          <div className="bg-[rgb(var(--on-error)/0.1)] text-[rgb(var(--on-error)/1)] rounded-lg px-4 py-2 mb-3 text-center">
            {error}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="text-[rgb(var(--on-surface)/1)]/70 py-4 text-center">
            No messages yet.
          </div>
        )}
        {!loading && !error && messages.length > 0 && (
          <ul className="flex flex-col gap-2 py-2">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className="bg-[rgb(var(--background)/0.5)] rounded-lg px-4 py-2 flex items-center gap-2"
              >
                {/* If you have avatars, you can add here (example only): 
                <img src={msg.user.avatar} className="w-7 h-7 rounded-full mr-2" alt="" />
                */}
                <span className="font-semibold text-[rgb(var(--primary)/1)]">
                  {msg.user.username}:
                </span>
                <span className="text-[rgb(var(--on-surface)/1)]">
                  {msg.content}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="px-6 pb-5">
        <form className="flex gap-2" onSubmit={sendMessage}>
          <input
            className="flex-1 px-4 py-2 rounded-lg bg-[rgb(var(--background)/1)] text-[rgb(var(--on-surface)/1)] border border-[rgb(var(--on-surface)/0.15)] focus:outline-none focus:border-[rgb(var(--primary)/1)] font-medium"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message"
            disabled={!token || !channelId}
            autoComplete="off"
          />
          <button
            type="submit"
            className={`px-5 py-2 rounded-full font-semibold bg-[rgb(var(--primary)/1)] text-[rgb(var(--on-primary)/1)] transition-colors hover:bg-[rgb(var(--primary-dark)/1)] focus:outline-none ${
              !content.trim() || !token || !channelId
                ? 'opacity-60 cursor-not-allowed'
                : ''
            }`}
            disabled={!content.trim() || !token || !channelId}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

ChannelChat.propTypes = {
  channelId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

export default ChannelChat;
