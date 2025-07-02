import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  const receiverId = selectedUser?._id || selectedUser?.id;
  const senderId = authUser?._id || authUser?.id;

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (!receiverId || !senderId) {
      toast.error("User not selected or logged in.");
      return;
    }

    await sendMessage({
      text: input.trim(),
      receiverId,
    });

    setInput('');
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (!receiverId || !senderId) {
        toast.error("User not selected or logged in.");
        return;
      }

      await sendMessage({
        image: reader.result,
        receiverId,
      });
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (receiverId) getMessages(receiverId);
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!selectedUser || !authUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} className="w-16" alt="Logo" />
        <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt="User"
          className="w-8 h-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser?.fullName || "User"}
          {onlineUsers?.includes(receiverId) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="Back"
          className="md:hidden w-7 cursor-pointer"
        />
        <img src={assets.help_icon} alt="Help" className="hidden md:block w-5" />
      </div>

      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3">
        {messages?.map((msg, index) => {
          const isSender = msg.senderId === senderId;

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              {!isSender && (
                <div className="text-center text-xs">
                  <img
                    src={selectedUser?.profilePic || assets.avatar_icon}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full"
                  />
                  <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                </div>
              )}

              {msg.image ? (
                <img
                  src={msg.image}
                  alt="Attachment"
                  className="max-w-[230px] border border-gray-700 rounded-lg mb-8"
                />
              ) : (
                <p
                  className={`p-2 max-w-[200px] text-sm md:text-base font-light rounded-lg mb-8 break-words bg-violet-500/30 text-white ${
                    isSender ? 'rounded-br-none' : 'rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </p>
              )}

              {isSender && (
                <div className="text-center text-xs">
                  <img
                    src={authUser?.profilePic ?? assets.avatar_icon}
                    alt="Sender"
                    className="w-7 h-7 rounded-full"
                  />
                  <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={scrollEnd} />
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => (e.key === 'Enter' ? handleSendMessage(e) : null)}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png,image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="Send Image" className="w-5 mr-2 cursor-pointer" />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt="Send"
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ChatContainer;
