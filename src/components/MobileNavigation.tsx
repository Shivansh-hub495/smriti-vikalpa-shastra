import React from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileNavigationProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
  className?: string;
}

// Standalone mobile header component that creates its own sidebar context
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  title,
  showBackButton = false,
  onBack,
  children,
  className
}) => {
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div
        className={cn(
          "flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50",
          className
        )}
      >
        <div className="flex items-center space-x-3">
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <SidebarTrigger />
          {title && (
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          )}
        </div>
        {children}
      </div>
    </SidebarProvider>
  );
};

export default MobileNavigation;
