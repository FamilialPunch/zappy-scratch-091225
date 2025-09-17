'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/auth';

interface MenuItem {
  name: string;
  href: string;
  icon: JSX.Element;
  badge?: number;
}

interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive }) => {
  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-indigo-100 text-indigo-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        <span className="w-5 h-5">{item.icon}</span>
        <span className="ml-4 text-sm">{item.name}</span>
        {item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if we're on pages that don't need the layout
  const isLoginPage = pathname === '/patient/login';
  const isHealthQuizPage = pathname === '/patient/health-quiz';
  const isNewConsultationPage = pathname === '/patient/new-consultation';
  const noLayoutPages = isLoginPage || isHealthQuizPage || isNewConsultationPage;

  useEffect(() => {
    // Don't check auth on pages that don't need layout
    if (noLayoutPages) return;

    try {
      const current = authService.getUser();
      if (current) {
        setUser(current);
      } else {
        router.push('/patient/login');
      }
    } catch {
      router.push('/patient/login');
    }
  }, [router, isLoginPage, noLayoutPages]);

  const primaryMenuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      href: '/patient/dashboard',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Consultations',
      href: '/patient/consultations',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'My Orders',
      href: '/patient/orders',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      name: 'Messages',
      href: '/patient/messages',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: 2,
    },
    {
      name: 'Subscription',
      href: '/patient/subscription',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  const secondaryMenuItems: MenuItem[] = [
    {
      name: 'Profile',
      href: '/patient/profile',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    // Clear using authService for consistency
    try { authService.logout(); } catch {}
    router.push('/');
  };

  // If we're on pages that don't need layout, just render the children
  if (noLayoutPages) {
    return <>{children}</>;
  }

  // If not logged in and not on login page, show loading
  if (!user) {
    return <div>Loading...</div>;
  }

  const sidebarContent = (
    <div className="flex flex-col w-64 bg-white h-full border-r border-slate-200">
      {/* Simple Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-200">
        <span className="text-xl font-bold text-medical-600">TeleHealth</span>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav>
          <ul>
            {primaryMenuItems.map((item) => (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={pathname === item.href}
              />
            ))}
          </ul>
          
          <hr className="my-6 border-t border-slate-200" />
          
          <ul>
            {secondaryMenuItems.map((item) => (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={pathname === item.href}
              />
            ))}
          </ul>
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-4 text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 text-slate-800">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          aria-hidden="true" 
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button 
              type="button" 
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" 
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {sidebarContent}
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true" />
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button - positioned absolutely */}
        <button
          type="button"
          className="lg:hidden fixed top-4 right-4 z-30 px-2 py-1.5 bg-white rounded-md shadow-lg text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page Content - no header */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
