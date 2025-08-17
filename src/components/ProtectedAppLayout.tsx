import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import { Outlet } from 'react-router-dom';
import ChatbotAssistant from '@/components/ChatbotAssistant';

// Persistent app layout wrapped with auth protection.
// Keeps the sidebar mounted across route transitions to prevent flicker.
const ProtectedAppLayout: React.FC = () => {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <AppSidebar />
          <SidebarInset>
            <Outlet />
            <ChatbotAssistant />
            <ScrollToTop />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default ProtectedAppLayout;

