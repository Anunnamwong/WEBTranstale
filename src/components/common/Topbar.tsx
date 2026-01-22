import { signIn, signOut, useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';
import { LockClosedIcon, ArrowLeftStartOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

type TopbarProps = {
  onToggleSidebar?: () => void;
  title?: string;
};

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, title }) => {
  const { data: session, status } = useSession();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    await signIn('zitadel', {
      callbackUrl: '/home',
      redirect: true,
    });
  };

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/login-zitadel',
      redirect: true,
    });
  };

  const getInitials = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getName = () => {
    return session?.user?.name || session?.user?.email || 'User';
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-4 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-indigo-600" />
          <span className="font-semibold tracking-tight text-neutral-900">
            {title || "App"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status === 'loading' ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        ) : session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-neutral-700">
                {getName()}
              </span>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-900">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-neutral-500 truncate">{session.user?.email}</p>
                  {session.user?.id && (
                    <p className="text-xs text-neutral-400 font-mono mt-1">ID: {session.user.id}</p>
                  )}
                </div>
                <div className="px-2 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <LockClosedIcon className="w-5 h-5" />
            <span className="hidden sm:inline">เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
