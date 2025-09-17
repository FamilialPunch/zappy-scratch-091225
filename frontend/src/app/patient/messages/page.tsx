'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MessageThread {
  id: string;
  participants: {
    from: string;
    to: string;
  };
  subject: string;
  lastMessage: string;
  timestamp: string;
  date: string;
  isUrgent?: boolean;
  isUnread?: boolean;
  hasAttachment?: boolean;
}

type FilterTab = 'all' | 'unread' | 'fromPatients' | 'fromProviders';

export default function PatientMessages() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Mock data based on the image
  const messageThreads: MessageThread[] = [
    {
      id: '1',
      participants: {
        from: 'Sarah Johnson',
        to: 'Dr. Smith'
      },
      subject: 'Question about prescription',
      lastMessage: 'Hi Dr. Smith, I have a question about my new prescription...',
      timestamp: '02:30 PM',
      date: '1/15/2024',
      isUnread: true,
      isUrgent: false
    },
    {
      id: '2',
      participants: {
        from: 'Dr. Jones',
        to: 'Dr. Smith'
      },
      subject: 'Patient referral',
      lastMessage: 'I have a patient who needs specialized care...',
      timestamp: '12:00 PM',
      date: '1/15/2024',
      isUnread: true,
      hasAttachment: true
    },
    {
      id: '3',
      participants: {
        from: 'System',
        to: 'Dr. Smith'
      },
      subject: 'New lab results available',
      lastMessage: 'Lab results for patient Michael Chen are now available...',
      timestamp: '10:00 AM',
      date: '1/15/2024',
      isUrgent: true
    }
  ];

  const filteredThreads = messageThreads.filter(thread => {
    switch (activeTab) {
      case 'unread':
        return thread.isUnread;
      case 'fromPatients':
        return thread.participants.from !== 'System' && !thread.participants.from.includes('Dr.');
      case 'fromProviders':
        return thread.participants.from.includes('Dr.');
      default:
        return true;
    }
  });

  const stats = {
    totalMessages: messageThreads.length,
    unread: messageThreads.filter(m => m.isUnread).length,
    urgent: messageThreads.filter(m => m.isUrgent).length,
    responseRate: 98
  };

  const handleCompose = () => {
    // Navigate to compose message page or open modal
    router.push('/patient/messages/compose');
  };

  const handleThreadClick = (threadId: string) => {
    // Navigate to message thread detail
    router.push(`/patient/messages/${threadId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600 mt-1">Communicate with patients and providers</p>
            </div>
            <button
              onClick={handleCompose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Compose Message
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Unread</p>
            <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Urgent</p>
            <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Response Rate</p>
            <p className="text-2xl font-bold text-green-600">{stats.responseRate}%</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Messages
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'unread'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Unread ({stats.unread})
              </button>
              <button
                onClick={() => setActiveTab('fromPatients')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'fromPatients'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                From Patients
              </button>
              <button
                onClick={() => setActiveTab('fromProviders')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'fromProviders'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                From Providers
              </button>
            </nav>
          </div>

          {/* Message Threads */}
          <div className="divide-y divide-gray-200">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Unread indicator */}
                      {thread.isUnread && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900">
                        {thread.participants.from} → {thread.participants.to}
                      </h3>
                      {/* Attachment indicator */}
                      {thread.hasAttachment && (
                        <span className="text-yellow-600" title="Has attachment">
                          📎
                        </span>
                      )}
                      {/* Urgent indicator */}
                      {thread.isUrgent && (
                        <span className="text-red-600" title="Urgent">
                          🔴
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{thread.subject}</p>
                    <p className="text-sm text-gray-600 truncate">{thread.lastMessage}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500">{thread.timestamp}</p>
                    <p className="text-xs text-gray-400">{thread.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredThreads.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No messages found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}