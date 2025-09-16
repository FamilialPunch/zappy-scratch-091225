'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface NavigationItem {
  name: string;
  href: string;
  icon: string | React.ReactNode;
  badge?: number | null;
  roles: UserRole[];
  section?: 'clinical' | 'admin' | 'both';
}

export default function UnifiedPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [userName, setUserName] = useState('');
  const [userTitle, setUserTitle] = useState('');
  const [messagesBadge, setMessagesBadge] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; description?: string; time?: string; href?: string; read?: boolean }[]
  >([]);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const inboxRef = useRef<HTMLDivElement | null>(null);
  const [hideSyntheticMessagesItem, setHideSyntheticMessagesItem] = useState(false);

  useEffect(() => {
    // Get user role from localStorage or auth context
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedUserData = localStorage.getItem('userData');
    const storedUnread = parseInt(localStorage.getItem('messagesUnreadCount') || '0', 10);
    if (!Number.isNaN(storedUnread)) setMessagesBadge(storedUnread);
    
    if (storedRole) {
      setUserRole(storedRole);
    } else {
      // If no role is set, default to provider
      setUserRole('provider');
    }
    
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUserName(userData.name || 'User');
      setUserTitle(userData.title || '');
    } else {
      setUserName('User');
      setUserTitle('');
    }
    // Listen for unread count updates within the app
    const handleCustom = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as number;
        if (typeof detail === 'number') {
          setMessagesBadge(detail);
          // New activity should re-show synthetic item
          setHideSyntheticMessagesItem(false);
        }
      } catch {}
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'messagesUnreadCount' && e.newValue !== null) {
        const n = parseInt(e.newValue, 10);
        if (!Number.isNaN(n)) {
          setMessagesBadge(n);
          setHideSyntheticMessagesItem(false);
        }
      }
    };
    window.addEventListener('messagesUnreadCountChanged', handleCustom as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('messagesUnreadCountChanged', handleCustom as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [pathname]); // Re-run when pathname changes to catch navigation from login

  // Load any stored notifications from localStorage (optional, safe if empty)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setNotifications(parsed);
      }
    } catch {}
  }, []);

  // Close notifications when navigating
  useEffect(() => {
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  }, [pathname]);

  // Close on outside click and Escape
  useEffect(() => {
    if (!isNotificationsOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isNotificationsOpen]);

  // Close Inbox modal on Escape and outside click
  useEffect(() => {
    if (!isInboxOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(e.target as Node)) {
        setIsInboxOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsInboxOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isInboxOpen]);

  // Skip layout for login pages
  if (pathname?.includes('/login')) {
    return <>{children}</>;
  }

  // Define all navigation items with role-based access
  const allNavigation: NavigationItem[] = [
    // Dashboard - available to all
    {
      name: 'Dashboard',
      href: '/portal/dashboard',
      icon: '◉',
      badge: null,
      roles: ['provider', 'admin', 'provider-admin', 'super-admin'],
      section: 'both'
    },
    
    // Clinical-only features (Provider access)
    {
      name: 'Consultations',
      href: '/portal/consultations',
      icon: '◐',
      badge: 12,
      roles: ['provider', 'provider-admin', 'super-admin'], // No admin access
      section: 'clinical'
    },
    {
      name: 'Patients',
      href: '/portal/patients',
      icon: '◑',
      badge: null,
      roles: ['provider', 'admin', 'provider-admin', 'super-admin'], // All roles (but admin sees limited view)
      section: 'both'
    },
    {
      name: 'Messages',
      href: '/portal/messages',
      icon: '◒',
      badge: messagesBadge,
      roles: ['provider', 'admin', 'provider-admin', 'super-admin'], // All roles
      section: 'both'
    },
    
    // Admin-only features
    {
      name: 'Orders',
      href: '/portal/orders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Providers',
      href: '/portal/providers',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Medications',
      href: '/portal/medications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Protocols',
      href: '/portal/protocols',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Plans',
      href: '/portal/plans',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Forms',
      href: '/portal/forms',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Pharmacy',
      href: '/portal/pharmacy',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Analytics',
      href: '/portal/analytics',
      icon: '◔',
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    },
    {
      name: 'Settings',
      href: '/portal/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      badge: null,
      roles: ['admin', 'provider-admin', 'super-admin'], // No provider access
      section: 'admin'
    }
  ];

  // Filter navigation based on user role
  const filteredNavigation = allNavigation.filter(item => 
    item.roles.includes(userRole)
  );

  // Separate navigation into clinical and admin sections
  const clinicalNav = filteredNavigation.filter(item => 
    item.section === 'clinical' || item.section === 'both'
  );
  
  const adminNav = filteredNavigation.filter(item => 
    item.section === 'admin'
  );

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    router.push('/portal/login');
  };

  // Get user initials for avatar
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasUnreadNotifications = notifications.some(n => !n.read) || messagesBadge > 0;

  // Build an effective list so the bell reflects unread Messages even if no stored notifications exist
  const effectiveNotifications = (() => {
    const list = [...notifications];
    if (messagesBadge > 0 && !hideSyntheticMessagesItem) {
      // Prepend a synthetic unread-messages item
      list.unshift({
        id: 'messages-unread',
        title: `${messagesBadge} unread message${messagesBadge === 1 ? '' : 's'}`,
        description: 'Go to Messages to view and reply',
        href: '/portal/messages',
        time: 'Just now',
        read: false,
      });
    }
    return list;
  })();

  const clearUnreadMessages = (newCount = 0) => {
    try {
      localStorage.setItem('messagesUnreadCount', String(newCount));
    } catch {}
    setMessagesBadge(newCount);
    try { window.dispatchEvent(new CustomEvent('messagesUnreadCountChanged', { detail: newCount })); } catch {}
  };

  const markAllAsRead = () => {
    // Mark stored notifications as read (affects dropdown items)
    setNotifications((prev) => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
    // Also clear unread messages count so the bell dot disappears
    // This ensures consistency between the synthetic Messages item and the badge state
    clearUnreadMessages(0);
    // Hide synthetic messages item for this session until a new unread count arrives
    setHideSyntheticMessagesItem(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Unified Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} h-full overflow-hidden bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">Z</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Zappy Health</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded transition text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={sidebarCollapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
  <nav className="flex-1 px-3 py-4 overflow-y-auto thin-scrollbar">
          {/* For Provider role - just show items without section headers */}
          {userRole === 'provider' && (
            <div className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm
                      ${isActive 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${typeof item.icon === 'string' ? 'text-lg' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && item.badge && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        isActive ? 'bg-white text-gray-900' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* For Admin role - just show items without section headers */}
          {userRole === 'admin' && (
            <div className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm
                      ${isActive 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${typeof item.icon === 'string' ? 'text-lg' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && item.badge && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        isActive ? 'bg-white text-gray-900' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* For Provider-Admin and Super-Admin - show with section headers */}
          {(userRole === 'provider-admin' || userRole === 'super-admin') && (
            <>
              {/* Clinical Section */}
              {clinicalNav.length > 0 && (
                <div className="space-y-1">
                  {!sidebarCollapsed && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">
                      Clinical
                    </div>
                  )}
                  {clinicalNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm
                          ${isActive 
                            ? 'bg-gray-900 text-white' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`${typeof item.icon === 'string' ? 'text-lg' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <span className="font-medium">{item.name}</span>
                          )}
                        </div>
                        {!sidebarCollapsed && item.badge && (
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            isActive ? 'bg-white text-gray-900' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              {clinicalNav.length > 0 && adminNav.length > 0 && !sidebarCollapsed && (
                <div className="my-6 border-t border-gray-200"></div>
              )}

              {/* Admin Section */}
              {adminNav.length > 0 && (
                <div className="space-y-1">
                  {!sidebarCollapsed && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">
                      Administration
                    </div>
                  )}
                  {adminNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm
                          ${isActive 
                            ? 'bg-gray-900 text-white' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`${typeof item.icon === 'string' ? 'text-lg' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <span className="font-medium">{item.name}</span>
                          )}
                        </div>
                        {!sidebarCollapsed && item.badge && (
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            isActive ? 'bg-white text-gray-900' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">{userInitials}</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userTitle || userRole}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="mt-3 flex space-x-2">
              {(userRole === 'super-admin') && (
                <button
                  onClick={() => router.push('/portal/system-config')}
                  className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition text-center"
                >
                  System
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition text-center"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

  {/* Main Content */}
  <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {pathname ? 
                  (pathname.split('/').pop()?.charAt(0)?.toUpperCase() ?? '') + (pathname.split('/').pop()?.slice(1) ?? '') 
                  : 'Dashboard'}
              </h1>
              {/* Role Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userRole === 'provider' ? 'bg-blue-100 text-blue-800' :
                userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                userRole === 'provider-admin' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {userRole === 'provider' ? 'Provider' : 
                 userRole === 'admin' ? 'Admin' :
                 userRole === 'provider-admin' ? 'Provider + Admin' : 
                 userRole === 'super-admin' ? 'Super Admin' : 
                 userRole}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isNotificationsOpen}
                  aria-label="Notifications"
                  onClick={() => setIsNotificationsOpen((o) => !o)}
                  className="relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {hasUnreadNotifications && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    role="menu"
                    aria-label="Notifications"
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">Notifications</div>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto thin-scrollbar">
                      {effectiveNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500 text-center">You're all caught up.</div>
                      ) : (
                        effectiveNotifications.map((n) => {
                          const indicator = n.read ? 'bg-gray-300' : 'bg-red-400';
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (n.id === 'messages-unread') {
                                  // Only hide from dropdown; do not clear unread count globally
                                  setHideSyntheticMessagesItem(true);
                                }
                                if (n.href) router.push(n.href);
                                setIsNotificationsOpen(false);
                                // Mark individual as read
                                if (n.id !== 'messages-unread') {
                                  setNotifications((prev) => {
                                    const updated = prev.map(x => x.id === n.id ? { ...x, read: true } : x);
                                    try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
                                    return updated;
                                  });
                                }
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start space-x-3 ${n.read ? 'opacity-80' : ''}`}
                            >
                              <span className={`mt-1 w-2 h-2 rounded-full ${indicator}`}></span>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">{n.title}</div>
                                {n.description && (
                                  <div className="text-xs text-gray-500 mt-0.5">{n.description}</div>
                                )}
                                {n.time && (
                                  <div className="text-[11px] text-gray-400 mt-0.5">{n.time}</div>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100">
                      <button
                        onClick={() => { setIsNotificationsOpen(false); setIsInboxOpen(true); }}
                        className="w-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md py-2"
                      >
                        Open inbox
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Help */}
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {children}
        </main>

        {/* Popup Inbox Modal */}
        {isInboxOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Inbox"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <div ref={inboxRef} className="w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white text-xs">{messagesBadge}</span>
                  <h2 className="text-base font-semibold text-gray-900">Inbox</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={markAllAsRead} className="text-xs text-gray-500 hover:text-gray-700">Mark all as read</button>
                  <button onClick={() => setIsInboxOpen(false)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" aria-label="Close inbox">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto thin-scrollbar">
                {effectiveNotifications.length === 0 ? (
                  <div className="p-8 text-sm text-gray-500 text-center">You're all caught up.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {effectiveNotifications.map((n) => {
                      const indicator = n.read ? 'bg-gray-300' : 'bg-red-400';
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.id === 'messages-unread') {
                              setHideSyntheticMessagesItem(true);
                            }
                            if (n.href) router.push(n.href);
                            setIsInboxOpen(false);
                            if (n.id !== 'messages-unread') {
                              setNotifications((prev) => {
                                const updated = prev.map(x => x.id === n.id ? { ...x, read: true } : x);
                                try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
                                return updated;
                              });
                            }
                          }}
                          className={`w-full text-left px-5 py-4 hover:bg-gray-50 flex items-start gap-3 ${n.read ? 'opacity-80' : ''}`}
                        >
                          <span className={`mt-1 w-2 h-2 rounded-full ${indicator}`}></span>
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{n.title}</div>
                            {n.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{n.description}</div>
                            )}
                            {n.time && (
                              <div className="text-[11px] text-gray-400 mt-0.5">{n.time}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <Link href="/portal/messages" className="text-sm text-gray-600 hover:text-gray-900">Go to Messages</Link>
                <button onClick={() => setIsInboxOpen(false)} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
