'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  priority: 'normal' | 'high' | 'urgent';
  type: 'patient' | 'provider' | 'system' | 'admin';
}

export default function MessagesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'patient' | 'provider' | 'system'>('all');
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; messageId: string | null }>({ visible: false, x: 0, y: 0, messageId: null });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Try to get role from localStorage, but don't redirect if not found
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (role) {
      setUserRole(role);
    } else {
      // Default to provider if no role is set
      setUserRole('provider');
      // Set default role in localStorage for consistency
      localStorage.setItem('userRole', 'provider');
    }

    fetchMessages();

    // Close context menu on global click or Esc
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu((m) => ({ ...m, visible: false }));
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu((m) => ({ ...m, visible: false }));
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const fetchMessages = async () => {
    // Mock data
    const mockMessages: Message[] = [
      {
        id: '1',
        from: 'Sarah Johnson',
        to: 'Dr. Smith',
        subject: 'Question about prescription',
        preview: 'Hi Dr. Smith, I have a question about my new prescription...',
        date: '2024-01-15T14:30:00',
        read: false,
        priority: 'normal',
        type: 'patient'
      },
      {
        id: '2',
        from: 'Dr. Jones',
        to: 'Dr. Smith',
        subject: 'Patient referral',
        preview: 'I have a patient who needs specialized care...',
        date: '2024-01-15T12:00:00',
        read: true,
        priority: 'high',
        type: 'provider'
      },
      {
        id: '3',
        from: 'System',
        to: 'Dr. Smith',
        subject: 'New lab results available',
        preview: 'Lab results for patient Michael Chen are now available...',
        date: '2024-01-15T10:00:00',
        read: false,
        priority: 'urgent',
        type: 'system'
      },
    ];
    
    // Merge persisted read states from localStorage
    const persisted = localStorage.getItem('messagesReadState');
    let merged = mockMessages;
    if (persisted) {
      try {
        const map: Record<string, boolean> = JSON.parse(persisted);
        merged = mockMessages.map((m) =>
          map[m.id] !== undefined ? { ...m, read: map[m.id] } : m
        );
      } catch {}
    }
    setMessages(merged);
    // Update unread count badge on load
    const unread = merged.filter(m => !m.read).length;
    localStorage.setItem('messagesUnreadCount', String(unread));
    window.dispatchEvent(new CustomEvent('messagesUnreadCountChanged', { detail: unread }));
    setLoading(false);
  };

  const persistReadStates = (list: Message[]) => {
    const map: Record<string, boolean> = {};
    list.forEach((m) => (map[m.id] = m.read));
    localStorage.setItem('messagesReadState', JSON.stringify(map));
  };

  const markMessage = (id: string, read: boolean) => {
    setMessages((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, read } : m));
      persistReadStates(updated);
      const unread = updated.filter(m => !m.read).length;
      localStorage.setItem('messagesUnreadCount', String(unread));
      window.dispatchEvent(new CustomEvent('messagesUnreadCountChanged', { detail: unread }));
      return updated;
    });
    setContextMenu((m) => ({ ...m, visible: false }));
  };

  const markAllRead = () => {
    setMessages((prev) => {
      const updated = prev.map((m) => ({ ...m, read: true }));
      persistReadStates(updated);
      localStorage.setItem('messagesUnreadCount', '0');
      window.dispatchEvent(new CustomEvent('messagesUnreadCountChanged', { detail: 0 }));
      return updated;
    });
    setContextMenu((m) => ({ ...m, visible: false }));
  };

  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !message.read;
    return message.type === filter;
  });

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return '🔴';
    if (priority === 'high') return '🟡';
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with patients and providers</p>
        </div>
        <button 
          onClick={() => {
            router.push('/portal/messages/compose');
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Compose Message
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Messages</p>
          <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Unread</p>
          <p className="text-2xl font-bold text-blue-600">
            {messages.filter(m => !m.read).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Urgent</p>
          <p className="text-2xl font-bold text-red-600">
            {messages.filter(m => m.priority === 'urgent').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Response Rate</p>
          <p className="text-2xl font-bold text-green-600">98%</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'unread' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Unread ({messages.filter(m => !m.read).length})
        </button>
        <button
          onClick={() => setFilter('patient')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'patient' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          From Patients
        </button>
        <button
          onClick={() => setFilter('provider')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'provider' 
              ? 'bg-gray-900 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          From Providers
        </button>
      </div>

      {/* Messages List */}
      <Card className="divide-y divide-gray-200">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
              !message.read ? 'bg-blue-50' : ''
            }`}
            onClick={() => router.push(`/portal/messages/${message.id}`)}
            onContextMenu={(e) => {
              e.preventDefault();
              // Clamp menu within viewport bounds
              const menuWidth = 192; // ~w-48
              const menuHeight = 140; // approx height for 3 options
              const padding = 8;
              const x = Math.min(e.clientX, window.innerWidth - menuWidth - padding);
              const y = Math.min(e.clientY, window.innerHeight - menuHeight - padding);
              setContextMenu({ visible: true, x, y, messageId: message.id });
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {!message.read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/portal/messages/${message.id}`);
                    }}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                  >
                    {message.from}
                  </button>
                  <span className="text-sm text-gray-500">→</span>
                  <span className="text-sm text-gray-600">
                    {message.to}
                  </span>
                  {message.priority !== 'normal' && (
                    <span className="text-sm">{getPriorityIcon(message.priority)}</span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-gray-900">
                  {message.subject}
                </h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                  {message.preview}
                </p>
              </div>
              <div className="ml-4 text-right">
                <p className="text-xs text-gray-500">
                  {new Date(message.date).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(message.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.messageId && (
        <div
          ref={menuRef}
          className="fixed z-50 w-48 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            // Prevent the browser menu when right-clicking inside our custom menu
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {(() => {
            const msg = messages.find((m) => m.id === contextMenu.messageId);
            const isRead = !!msg?.read;
            return (
              <>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => markMessage(contextMenu.messageId!, !isRead)}
                >
                  {isRead ? 'Mark as Unread' : 'Mark as Read'}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={markAllRead}
                >
                  Mark all as Read
                </button>
                <div className="border-t border-gray-200" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
                  onClick={() => setContextMenu((m) => ({ ...m, visible: false }))}
                >
                  Cancel
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
