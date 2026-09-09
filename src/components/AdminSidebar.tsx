import React from 'react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FileEdit,
  Settings,
  Images,
  Bell,
  LogOut,
  UserCircle,
  FileText,
  Image,
  UsersRound,
  Calendar
} from "lucide-react";

interface AdminSidebarProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  username: string;
  isSuperAdmin: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  children,
  activeTab,
  onTabChange,
  onLogout,
  username,
  isSuperAdmin,
}) => {
  const isMobile = useIsMobile();

  // Define sidebar menu items
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      id: "dashboard",
    },
    {
      title: "Programs",
      icon: FileEdit,
      id: "programs",
    },
    {
      title: "Event Calendar",
      icon: Calendar,
      id: "events",
    },
    {
      title: "Registrations",
      icon: Users,
      id: "registrations",
    },
    {
      title: "Announcements",
      icon: Bell,
      id: "announcements",
    },
    {
      title: "Team",
      icon: UsersRound,
      id: "team",
    },
    // Only show Admins to superadmins
    ...(isSuperAdmin ? [{
      title: "Admin Users",
      icon: UserCircle,
      id: "admins",
    }] : []),
    {
      title: "Features",
      icon: Settings,
      id: "features",
    },
    {
      title: "Gallery",
      icon: Images,
      id: "gallery",
    },
    // Add new content management option for superadmins
    ...(isSuperAdmin ? [{
      title: "Content",
      icon: FileText,
      id: "content",
    }] : []),
    // Add media library for superadmins
    ...(isSuperAdmin ? [{
      title: "Media Library",
      icon: Image,
      id: "media",
    }] : []),
    // Add customers tab
    {
      title: "Customers",
      icon: Users,
      id: "customers",
    },
    {
      title: "Coach Availability",
      icon: Calendar,
      id: "coach-availability",
    },
  ];

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar variant="sidebar" className="border-r border-gray-200 bg-white shadow-sm">
          <SidebarHeader className="h-14 flex items-center px-4 border-b bg-white">
            <div className="flex items-center justify-center w-full font-bold text-lg text-gray-800">
              Admin Panel
            </div>
          </SidebarHeader>
          
          <SidebarContent className="bg-white">
            <SidebarMenu>
              {menuItems.map(({ id, title, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={activeTab === id}
                    tooltip={title}
                    onClick={() => onTabChange(id)}
                    className={cn(
                      "hover:bg-gray-100 transition-colors duration-200",
                      activeTab === id ? "bg-gray-100 text-primary font-medium" : "text-gray-700"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      activeTab === id ? "text-primary" : "text-gray-500"
                    )} />
                    <span>{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="border-t mt-auto bg-white">
            <div className="px-4 py-3 bg-gray-50">
              <div className="text-xs text-gray-500">
                Logged in as
              </div>
              <div className="font-medium text-gray-900 truncate">{username}</div>
              {isSuperAdmin && (
                <span className="text-xs text-amber-600 font-medium">Super Admin</span>
              )}
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLogout}
                  tooltip="Logout"
                  className="text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 min-w-0">
          <div className="h-14 border-b flex items-center px-4 lg:px-6 gap-4 bg-white shadow-sm">
            <SidebarTrigger />
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
          </div>
          
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminSidebar;
