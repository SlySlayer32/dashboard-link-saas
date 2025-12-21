import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Button } from './ui/Button';
import {
  HomeIcon,
  UserGroupIcon,
  PuzzlePieceIcon,
  CogIcon,
  MenuIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface NavigationProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Workers', href: '/workers', icon: UserGroupIcon },
  { name: 'Plugins', href: '/plugins', icon: PuzzlePieceIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export function Navigation({ isCollapsed: propIsCollapsed, onToggle }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Sync collapsed state with prop
  useEffect(() => {
    if (propIsCollapsed !== undefined) {
      setIsCollapsed(propIsCollapsed);
    }
  }, [propIsCollapsed]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null && propIsCollapsed === undefined) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, [propIsCollapsed]);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    onToggle?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleMobileMenuToggle}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
            <h1 className="ml-3 text-lg font-semibold text-gray-900">CleanConnect</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleMobileMenuToggle} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={handleMobileMenuToggle}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">CleanConnect</h1>
              </div>
              <nav className="mt-8 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      {user?.organizationName || 'Demo Organization'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="mt-3 w-full justify-start text-gray-500"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between flex-shrink-0 px-4">
              <h1
                className={`text-xl font-bold text-gray-900 transition-all duration-200 ${
                  isCollapsed ? 'hidden' : 'block'
                }`}
              >
                CleanConnect
              </h1>
              <button
                onClick={handleToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`flex-shrink-0 h-5 w-5 transition-colors ${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="ml-3 transition-opacity">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                        {user?.organizationName || 'Demo Organization'}
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="mt-3 w-full justify-start text-gray-500"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
