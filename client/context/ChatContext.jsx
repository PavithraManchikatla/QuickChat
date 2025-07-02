// context/ChatContext.js
import React, {
  useEffect,
  useState,
  useContext,
  createContext,
} from 'react';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios, authUser } = useContext(AuthContext);

  // ✅ Get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get('/api/messages/users');
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load users');
    }
  };

  // ✅ Get messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);

        // Mark unseen messages as seen
        data.messages.forEach((msg) => {
          if (!msg.seen) {
            axios.put(`/api/messages/mark/${msg._id}`);
          }
        });

        // Clear unseen count for that user
        setUnseenMessages((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load messages');
    }
  };

  // ✅ Send message to a user (text or image)
  const sendMessage = async ({ text, image, receiverId }) => {
    try {
      const finalReceiverId = receiverId || selectedUser?._id || selectedUser?.id;
      const senderId = authUser?._id || authUser?.id;

      if (!finalReceiverId || !senderId) {
        toast.error('Missing sender/receiver');
        return;
      }

      const payload = {
        text,
        image,
        senderId,
        receiverId: finalReceiverId,
      };

      const { data } = await axios.post(`/api/messages/send/${finalReceiverId}`, payload);

      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message || 'Message send failed');
      }
    } catch (error) {
      toast.error(error.message || 'Send error');
    }
  };

  // ✅ Handle socket "newMessage" event
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.senderId;

      if (selectedUser && senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedUser]);

  // ✅ Expose context
  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    unseenMessages,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
