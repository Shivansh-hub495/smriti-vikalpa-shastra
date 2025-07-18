
import { BookOpen, Home, Target, TrendingUp, Settings, Plus, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserProfile from "@/components/UserProfile";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Study",
    url: "/study",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Progress",
    url: "/progress",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Browse",
    url: "/browse",
    icon: Search,
    color: "from-yellow-500 to-orange-500",
  },
];

const quickActions = [
  {
    title: "Create Deck",
    url: "/create",
    icon: Plus,
    color: "from-orange-500 to-red-500",
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-white/20 dark:border-gray-700/20 shadow-xl flex flex-col">
      <SidebarHeader className="border-b border-white/20 dark:border-gray-700/20 p-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="/logo.png"
              alt="Smriti Logo"
              className="h-12 w-12 rounded-xl object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Smriti
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Memory Palace</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="group relative overflow-hidden rounded-xl px-3 !py-3 !h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <Link to={item.url} className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
                Quick Actions
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {quickActions.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="group relative overflow-hidden rounded-xl px-3 !py-3 !h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <Link to={item.url} className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/20 dark:border-gray-700/20 p-4 space-y-2 flex-shrink-0">
        <UserProfile />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="group relative overflow-hidden rounded-xl px-3 !py-3 !h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Link to="/settings" className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
