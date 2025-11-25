import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../contexts/auth-context';

const ChannelCreate = ({ onChannelCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleCreate = () => {
    setError('');
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }
    if (!token) {
      setError('You must be logged in to create a channel.');
      return;
    }
    setLoading(true);
    axios
      .post(
        '/api/channel/new',
        { name, description },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        if (onChannelCreated) onChannelCreated(res.data);
        setName('');
        setDescription('');
        setError('');
      })
      .catch((err) => {
        const serverError =
          err?.response?.data?.error || 'Unable to create channel';
        setError(serverError);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-[rgb(var(--surface)/1)] rounded-xl shadow-xl mb-6">
      <div className="px-6 pt-5 pb-3 text-xl font-semibold text-[rgb(var(--on-background)/1)]">
        Create Channel
      </div>
      <div className="px-6 pb-6">
        {error && (
          <div className="bg-[rgb(var(--on-error)/0.1)] text-[rgb(var(--on-error)/1)] rounded-lg px-4 py-2 mb-3">
            {error}
          </div>
        )}
        <input
          className="w-full mb-3 px-4 py-2 rounded-lg bg-[rgb(var(--background)/1)] text-[rgb(var(--on-surface)/1)] border border-[rgb(var(--on-surface)/0.15)] focus:outline-none focus:border-[rgb(var(--primary)/1)] font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Channel Name"
          autoComplete="off"
          disabled={loading}
        />
        <input
          className="w-full mb-4 px-4 py-2 rounded-lg bg-[rgb(var(--background)/1)] text-[rgb(var(--on-surface)/1)] border border-[rgb(var(--on-surface)/0.15)] focus:outline-none focus:border-[rgb(var(--primary)/1)] font-medium"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          autoComplete="off"
          disabled={loading}
        />
        <button
          type="button"
          className={`w-full py-2 rounded-full font-semibold bg-[rgb(var(--primary)/1)] text-[rgb(var(--on-primary)/1)] transition-colors hover:bg-[rgb(var(--primary-dark)/1)] focus:outline-none ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Channel'}
        </button>
      </div>
    </div>
  );
};

ChannelCreate.propTypes = {
  onChannelCreated: PropTypes.func,
};

ChannelCreate.defaultProps = {
  onChannelCreated: undefined,
};

export default ChannelCreate;
