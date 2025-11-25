import { useEffect, useState } from 'react';
import axios from 'axios';
import ChannelList from '../components/channel/ChannelList';
import ChannelCreate from '../components/channel/ChannelCreate';
import ChannelChat from '../components/channel/ChannelChat';
import { useAuth } from '../contexts/auth-context';

const ChannelsPage = () => {
  const { token } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [joinedChannels, setJoinedChannels] = useState([]);
  const [refreshList, setRefreshList] = useState(false);

  // Fetch joined channels from backend to maintain persistence across refreshes
  useEffect(() => {
    if (token) {
      axios
        .get('/api/channel/user/channels', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setJoinedChannels(res.data.map((m) => m.channelId));
        })
        .catch(() => setJoinedChannels([]));
    }
  }, [token]);

  // Join channel: call backend and update local state
  const handleJoinChannel = (channelId) => {
    if (!token) return;
    axios
      .post(
        `/api/channel/${channelId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (
          res.data &&
          res.data.membership &&
          res.data.membership.channelId === channelId
        ) {
          setJoinedChannels((prev) =>
            prev.includes(channelId) ? prev : [...prev, channelId]
          );
          setRefreshList((r) => !r);
        }
      })
      .catch((err) => {
        console.error(
          'Error joining channel:',
          err?.response?.data?.message || err.message
        );
      });
  };

  // Leave channel: call backend and update local state
  const handleLeaveChannel = (channelId) => {
    if (!token) return;
    axios
      .post(
        `/api/channel/${channelId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setJoinedChannels((prev) => prev.filter((id) => id !== channelId));
        setRefreshList((r) => !r);
        if (selectedChannel === channelId) {
          setSelectedChannel(null);
        }
      })
      .catch((err) => {
        console.error(
          'Error leaving channel:',
          err?.response?.data?.message || err.message
        );
      });
  };

  const handleChannelCreated = (newChannelData) => {
    setRefreshList((r) => !r);
    if (newChannelData && newChannelData.channel && newChannelData.channel.id) {
      setJoinedChannels((prev) =>
        prev.includes(newChannelData.channel.id)
          ? prev
          : [...prev, newChannelData.channel.id]
      );
    }
  };

  // Conditional chat content rendering
  let chatContent = (
    <div className="h-full flex items-center text-gray-400">
      <p>Select a channel to chat</p>
    </div>
  );

  if (selectedChannel) {
    if (joinedChannels.includes(selectedChannel)) {
      chatContent = <ChannelChat channelId={selectedChannel} />;
    } else {
      chatContent = (
        <div className="px-6 py-8 text-center text-[rgb(var(--on-surface)/1)]/70">
          You must join this channel to view or send messages.
        </div>
      );
    }
  }

  return (
    <div className="flex gap-8">
      <div>
        <ChannelCreate onChannelCreated={handleChannelCreated} />
        <ChannelList
          onSelectChannel={setSelectedChannel}
          joinedChannels={joinedChannels}
          onJoin={handleJoinChannel}
          onLeave={handleLeaveChannel}
          refreshList={refreshList}
        />
      </div>
      <div className="flex-1">{chatContent}</div>
    </div>
  );
};

export default ChannelsPage;
