import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../contexts/auth-context';

const ChannelList = ({
  onSelectChannel,
  joinedChannels = [],
  onJoin,
  onLeave,
  refreshList, // triggers refresh when changed
}) => {
  const { token } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      if (!token) {
        setChannels([]);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/channel/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChannels(res.data);
      } catch (err) {
        console.error('Failed to load channels:', err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [token, refreshList]);

  return (
    <div className="bg-[rgb(var(--surface)/1)] rounded-xl shadow-xl mb-6">
      <div className="px-6 pt-5 pb-3 text-xl font-semibold text-[rgb(var(--on-background)/1)]">
        Channels
      </div>
      <div className="px-6 pb-6" style={{ maxHeight: 350, overflowY: 'auto' }}>
        {loading && (
          <div className="text-[rgb(var(--on-surface)/1)]/70 py-4 text-center">
            Loading channels...
          </div>
        )}
        {!loading && channels.length === 0 && (
          <div className="text-[rgb(var(--on-surface)/1)]/70 py-4 text-center">
            No channels found.
          </div>
        )}
        {!loading && channels.length > 0 && (
          <ul>
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center justify-between py-2 px-4 my-1 rounded-lg hover:bg-[rgb(var(--background)/0.7)] transition-colors"
              >
                <button
                  type="button"
                  className="text-left font-medium text-[rgb(var(--on-surface)/1)] truncate focus:outline-none"
                  onClick={() => onSelectChannel(channel.id)}
                  aria-label={`View ${channel.name}`}
                  tabIndex={0}
                >
                  {channel.name}
                </button>
                {joinedChannels.includes(channel.id) ? (
                  <button
                    type="button"
                    onClick={() => onLeave(channel.id)}
                    tabIndex={0}
                    className="bg-red-600 text-white rounded-full px-4 py-1 text-sm font-semibold hover:bg-red-700 transition focus:outline-none"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onJoin(channel.id)}
                    tabIndex={0}
                    className="bg-[rgb(var(--primary)/1)] text-white rounded-full px-4 py-1 text-sm font-semibold hover:bg-[rgb(var(--primary-dark)/1)] transition focus:outline-none"
                  >
                    Join
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

ChannelList.propTypes = {
  onSelectChannel: PropTypes.func.isRequired,
  joinedChannels: PropTypes.arrayOf(PropTypes.number),
  onJoin: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  refreshList: PropTypes.bool,
};

ChannelList.defaultProps = {
  joinedChannels: [],
  refreshList: false,
};

export default ChannelList;
