import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user.email?.split('@')[0] || 'User';
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate('/settings');
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate('/settings');
  };

  const handleSignOut = async () => {
    try {
      setIsOpen(false);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 shadow-xl rounded-xl p-1 mx-2">
              {/* User Info Header */}
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <User className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Profile
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Settings className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Settings
                </button>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

              {/* Sign Out */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Button */}
      <Button
        variant="ghost"
        className="w-full justify-start px-3 py-2 h-auto hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3 w-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
              {getInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
        </div>
      </Button>
    </div>
  );
};

export default UserProfile;
