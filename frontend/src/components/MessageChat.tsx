'use client';

import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'patient' | 'provider';
  sender_name?: string;
  created_at: string;
  is_read: boolean;
  attachments?: any[];
}

interface MessageChatProps {
  consultationId: string;
  currentUserId: string;
  currentUserType: 'patient' | 'provider';
  currentUserName: string;
  recipientName?: string;
}

export default function MessageChat({
  consultationId,
  currentUserId,
  currentUserType,
  currentUserName,
  recipientName = 'Support Team',
}: MessageChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Socket.io connection
    const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    socketConnection.on('connect', () => {
      console.log('Connected to chat server');
      // Join consultation room
      socketConnection.emit('join_consultation', {
        consultationId,
        userId: currentUserId,
        userType: currentUserType,
      });
    });

    socketConnection.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketConnection.on('typing_status', ({ isTyping, userId }) => {
      if (userId !== currentUserId) {
        setOtherUserTyping(isTyping);
      }
    });

    setSocket(socketConnection);

    // Fetch existing messages
    fetchMessages();

    // Using Socket.io for real-time updates; Supabase realtime subscription removed

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
      // Cleanup handled by socket disconnect
    };
  }, [consultationId, currentUserId, currentUserType]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/consultation/${consultationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      sender_id: currentUserId,
      sender_type: currentUserType,
      sender_name: currentUserName,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    // Optimistically add message
    setMessages((prev) => [...prev, tempMessage]);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Send via API
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          content: messageContent,
          sender_type: currentUserType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessage.id ? data.message : msg))
        );

        // Emit via Socket.io for real-time delivery
        if (socket) {
          socket.emit('send_message', {
            consultationId,
            message: data.message,
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      setNewMessage(messageContent); // Restore message
    }

    scrollToBottom();
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      if (socket) {
        socket.emit('typing_status', {
          consultationId,
          userId: currentUserId,
          isTyping: true,
        });
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing_status', {
          consultationId,
          userId: currentUserId,
          isTyping: false,
        });
      }
    }, 1000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('consultation_id', consultationId);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Send message with file attachment
        await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            consultation_id: consultationId,
            content: `Shared a file: ${file.name}`,
            sender_type: currentUserType,
            attachments: [data.file],
          }),
        });

        fetchMessages();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{recipientName}</h3>
            {otherUserTyping && (
              <p className="text-sm text-gray-500 italic">Typing...</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-4">
                      {formatDate(message.created_at)}
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-medical-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {!isOwnMessage && (
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {message.sender_name || recipientName}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2">
                          {message.attachments.map((attachment: any, idx: number) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs underline ${
                                isOwnMessage ? 'text-medical-100' : 'text-medical-600'
                              }`}
                            >
                              📎 {attachment.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-medical-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                        {isOwnMessage && message.is_read && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-medical-500"
              rows={1}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
