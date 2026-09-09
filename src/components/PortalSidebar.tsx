import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  CheckSquare,
  Calendar,
  Megaphone,
  Target,
  UserPlus,
  TrendingUp,
  BookOpen,
  CreditCard,
  DollarSign,
  Receipt,
  Clock,
  Building,
  Shield,
  Database,
  MessageSquare,
  Menu,
  X,
  Tent,
  Mail,
  Ban,
  MousePointerClick,
  LineChart,
  Activity,
  UserCircle,
  CalendarOff,
  MapPin,
  Tag,
  Zap
} from "lucide-react";
import { ROLES } from '@/services/roleService';
import { coachAccessService } from '@/services/coachAccessService';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface PortalSidebarProps {
  userRole: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  username: string;
  department: string;
  children: React.ReactNode;
}

const PortalSidebar: React.FC<PortalSidebarProps> = ({ 
  userRole, 
  activeTab, 
  onTabChange, 
  username, 
  department, 
  children 
}) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasRecordPortalAccess, setHasRecordPortalAccess] = useState(false);

  React.useEffect(() => {
    if (userRole === ROLES.COACH && user?.id) {
      coachAccessService.checkAccess(user.id).then(setHasRecordPortalAccess);
    }
  }, [userRole, user?.id]);

  const getTabsForRole = (role: string) => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ];

    switch (role) {
      case ROLES.CEO:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'High-level overview of company performance, KPIs, and key metrics' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Deep-dive into business analytics and data-driven insights' },
          { id: 'reports', label: 'Reports', icon: FileText, description: 'Generate and review executive reports across all departments' },
          { id: 'approvals', label: 'Approvals', icon: CheckSquare, description: 'Review and approve pending requests from department heads' },
          { id: 'planning', label: 'Planning', icon: Calendar, description: 'Strategic planning tools for goals, milestones, and initiatives' },
          { id: 'communication', label: 'Communication', icon: MessageSquare, description: 'Send and receive messages across the organisation' },
          { id: 'cross-analytics', label: 'Cross Analytics', icon: TrendingUp, description: 'Compare performance metrics across multiple departments' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure system-wide preferences and options' }
        ];
      
      case ROLES.MARKETING:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Marketing performance overview — leads, campaigns, and engagement at a glance' },
          { id: 'leads', label: 'Leads (CRM)', icon: Target, description: 'Track and manage potential customer leads through the sales pipeline' },
          { id: 'content', label: 'Content (CMS)', icon: FileText, description: 'Create, edit, and publish website and marketing content' },
          { id: 'customers', label: 'Customers', icon: Users, description: 'View and manage your customer database and profiles' },
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone, description: 'Plan, launch, and track marketing campaigns and promotions' },
          { id: 'automations', label: 'Automations', icon: Zap, description: 'Trigger-based email sequences (welcome, drip, re-engagement) running on Resend' },
          { id: 'email-health', label: 'Email Health', icon: TrendingUp, description: 'Monitor email deliverability, open rates, and sender reputation' },
          { id: 'email-deliveries', label: 'Email Deliveries', icon: Mail, description: 'Track sent emails and their delivery status in real-time' },
          { id: 'email-segments', label: 'Email Segments', icon: Users, description: 'Create and manage audience segments for targeted email campaigns' },
          { id: 'email-suppressions', label: 'Suppressions', icon: Ban, description: 'Manage unsubscribed, bounced, and suppressed email addresses' },
          { id: 'user-engagement', label: 'User Engagement', icon: MousePointerClick, description: 'Analyse how users interact with your website and content' },
          { id: 'site-analytics', label: 'Site Analytics', icon: LineChart, description: 'Website traffic, page views, and visitor behaviour analytics' },
          { id: 'realtime', label: 'Real-Time', icon: Activity, description: 'Live view of current website visitors and their activity' },
          { id: 'faq', label: 'FAQ Manager', icon: MessageSquare, description: 'Create and manage frequently asked questions for the website' },
          { id: 'service-locations', label: 'Service Areas', icon: MapPin, description: 'Manage the service area locations displayed on the contact page map' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Detailed marketing analytics and performance reports' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'communication', label: 'Messages', icon: MessageSquare, description: 'Send and receive internal messages with your team' }
        ];
      
      case ROLES.HR:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'HR overview — headcount, open positions, and recent activity' },
          { id: 'employees', label: 'Employees', icon: Users, description: 'View and manage employee records, roles, and contact details' },
          { id: 'recruitment', label: 'Recruitment', icon: UserPlus, description: 'Post jobs, track applicants, and manage the hiring pipeline' },
          { id: 'performance', label: 'Performance', icon: TrendingUp, description: 'Track employee performance reviews, goals, and feedback' },
          { id: 'training', label: 'Training', icon: BookOpen, description: 'Schedule and manage employee training programmes and certifications' },
          { id: 'reports', label: 'Reports', icon: FileText, description: 'Generate HR reports on attendance, turnover, and workforce metrics' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'communication', label: 'Messages', icon: MessageSquare, description: 'Send and receive internal messages with your team' }
        ];
      
      case ROLES.ACCOUNTS:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview of revenue, expenses, outstanding balances and recent activity' },
          { id: 'collections', label: 'Pending Collections', icon: Receipt, description: 'Children who attended but haven\'t paid — follow up and record payments here' },
          { id: 'client-statements', label: 'Client Statements', icon: FileText, description: 'QuickBooks-style client statements showing visit history, charges, payments, and running balances' },
          { id: 'invoices', label: 'Invoices', icon: FileText, description: 'Create, send and track invoices for clients and registrations' },
          { id: 'client-discounts', label: 'Client Discounts', icon: Tag, description: 'Issue pre-purchase discounts to specific clients and email them the offer' },
          { id: 'bills', label: 'Bills (AP)', icon: FileText, description: 'Track bills owed to suppliers and vendors (Accounts Payable)' },
          { id: 'vendors', label: 'Vendors', icon: Building, description: 'Manage supplier and vendor contact details and payment terms' },
          { id: 'budget', label: 'Budget', icon: DollarSign, description: 'Set and monitor budgets by category to control spending' },
          { id: 'expenses', label: 'Expenses', icon: Receipt, description: 'Record and categorize business expenses, attach receipts, and match uploads' },
          { id: 'till-reconciliation', label: 'Till Reconciliation', icon: DollarSign, description: 'Reconcile M-Pesa till and physical cash drawer against system payments (daily/monthly/yearly)' },
          { id: 'reports', label: 'Reports', icon: BarChart3, description: 'Financial reports: Profit & Loss, Aging, and Daily Sales summaries' },
          { id: 'camp-analytics', label: 'Camp Analytics', icon: Tent, description: 'Registration and revenue analytics across all camp programs' },
          { id: 'data-explorer', label: 'Data Explorer', icon: Database, description: 'Query and explore financial data across tables with custom filters and joins' },
          { id: 'activity-categories', label: 'Activity Categories', icon: Tag, description: 'Manage the activity categories and aliases used by Budget, Expense and Financial Report filters' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'communication', label: 'Messages', icon: MessageSquare, description: 'Send and receive internal messages with your team' }
        ];
      
      case ROLES.COACH:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Your coaching overview — upcoming sessions, student count, and alerts' },
          { id: 'programs', label: 'Programs', icon: Calendar, description: 'View and manage the coaching programmes you are assigned to' },
          { id: 'students', label: 'Students', icon: Users, description: 'Browse student profiles, progress, and attendance records' },
          { id: 'schedule', label: 'Schedule', icon: Clock, description: 'View your upcoming sessions, classes, and time slots' },
          { id: 'availability', label: 'My Availability', icon: CalendarOff, description: 'Set the days and times you are available or unavailable to coach' },
          { id: 'resources', label: 'Resources', icon: BookOpen, description: 'Access training materials, drills, and coaching guides' },
          ...(hasRecordPortalAccess ? [{ id: 'record-portal', label: 'Record Portal', icon: Tent, description: 'Check in attendees and manage daily camp operations' }] : []),
          { id: 'reports', label: 'Reports', icon: FileText, description: 'View session reports and coaching performance summaries' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'communication', label: 'Messages', icon: MessageSquare, description: 'Send and receive internal messages with your team' }
        ];
      
      case ROLES.GOVERNANCE:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Governance overview — compliance status, risk scores, and pending actions' },
          { id: 'documents', label: 'Document Management', icon: FileText, description: 'Upload, organise, and version-control official company documents' },
          { id: 'compliance', label: 'GDPR Compliance', icon: Shield, description: 'Monitor data protection compliance and manage consent records' },
          { id: 'risk', label: 'Risk Management', icon: TrendingUp, description: 'Identify, assess, and track organisational risks and mitigations' },
          { id: 'policies', label: 'Policy Management', icon: BookOpen, description: 'Create, review, and publish company policies and procedures' },
          { id: 'audit', label: 'Audit Logs', icon: Database, description: 'View a chronological record of system actions and user activity' },
          { id: 'data-governance', label: 'Data Governance', icon: Settings, description: 'Define data ownership, quality standards, and access controls' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'communication', label: 'Messages', icon: MessageSquare, description: 'Send and receive internal messages with your team' }
        ];
      
      case ROLES.ADMIN:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'System administration overview — users, activity, and system health' },
          { id: 'users', label: 'User Management', icon: Users, description: 'Create, edit, and deactivate user accounts and assign roles' },
          { id: 'customer-management', label: 'Customer Management', icon: Users, description: 'View and manage customer records and contact information' },
          { id: 'camp-registrations', label: 'Camp Registrations', icon: Tent, description: 'Manage camp sign-ups, check-ins, and attendance records' },
          { id: 'program-registrations', label: 'Program Registrations', icon: Calendar, description: 'Manage enrolments and registrations for coaching programmes' },
          { id: 'collections', label: 'Pending Collections', icon: Receipt, description: 'Help accounts follow up on unpaid attendees — same view & edit rights as the Accounts team, with PDF invoices and CSV export' },
          { id: 'camp-analytics', label: 'Camp Analytics', icon: TrendingUp, description: 'Registration and revenue analytics across all camp programs' },
          { id: 'system', label: 'System Admin', icon: Database, description: 'Database management, backups, and system maintenance tools' },
          { id: 'settings', label: 'System Settings', icon: Settings, description: 'Configure global system settings and feature toggles' },
          { id: 'audit-logs', label: 'Audit Logs', icon: FileText, description: 'View a chronological record of all system actions and changes' },
          { id: 'lead-audit', label: 'Lead Source Audit', icon: FileText, description: 'Audit which public forms write the correct program_type into leads, and find missing/unknown values' },
          { id: 'company', label: 'Company Config', icon: Building, description: 'Set up company details, branding, and organisational structure' },
          { id: 'security', label: 'Security', icon: Shield, description: 'Manage authentication policies, permissions, and security rules' },
          { id: 'coach-availability', label: 'Coach Availability', icon: CalendarOff, description: 'View and manage coach availability schedules across programmes' },
          { id: 'budget', label: 'Budget', icon: DollarSign, description: 'Set and monitor budgets by category to control spending' },
          { id: 'expenses', label: 'Expenses', icon: Receipt, description: 'Record and categorize business expenses, attach receipts, and match uploads' },
          { id: 'my-profile', label: 'My Profile', icon: UserCircle, description: 'View and edit your personal profile information' },
          { id: 'communication', label: 'Messages', icon: MessageSquare, description: 'Send and receive internal messages with your team' }
        ];
      
      default:
        return baseTabs;
    }
  };

  const tabs = getTabsForRole(userRole);

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="h-full flex flex-col bg-white">
      {/* Brand */}
      <div className="px-6 py-4 border-b">
        <h1 className="text-lg font-semibold text-gray-800">Amuse.Ke Portal</h1>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-auto w-full items-center justify-start rounded-md px-2 py-2 text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt={username} />
                  <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-left">
                  <div className="font-semibold">{username}</div>
                  <div className="text-xs text-gray-500">{department}</div>
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {tabs.map((tab) => {
            const desc = (tab as any).description;

            const btn = (
              <Button
                key={tab.id}
                variant="ghost"
                className={`w-full justify-start ${mobile && desc ? 'h-auto py-2' : ''} ${activeTab === tab.id ? 'text-blue-600 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <tab.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className={mobile && desc ? 'flex flex-col items-start' : 'truncate'}>
                  <span className="truncate">{tab.label}</span>
                  {mobile && desc && (
                    <span className="text-[10px] leading-tight text-gray-400 font-normal whitespace-normal text-left">{desc}</span>
                  )}
                </span>
              </Button>
            );

            if (!mobile && desc) {
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px] text-xs">
                    {desc}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={tab.id}>{btn}</React.Fragment>;
          })}
        </TooltipProvider>
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent mobile />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-base font-semibold text-gray-800">Amuse.Ke Portal</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt={username} />
                  <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>{username}</div>
                <div className="text-xs text-gray-500 font-normal">{department}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="w-64 flex-shrink-0 border-r">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
};

export default PortalSidebar;
