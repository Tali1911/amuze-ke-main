import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Users, UserPlus, BarChart3, CalendarCheck, History, Receipt } from 'lucide-react';
import { AllRegistrationsTab } from './camp/AllRegistrationsTab';
import { AttendanceMarkingTab } from './camp/AttendanceMarkingTab';
import { GroundRegistrationTab } from './camp/GroundRegistrationTab';
import { CampReportsTab } from './camp/CampReportsTab';
import { DailyOperationsView } from './camp/DailyOperationsView';
import { AttendanceHistoryTab } from './camp/AttendanceHistoryTab';
import { PaymentHistoryTab } from './camp/PaymentHistoryTab';
import { CampTabId } from '@/services/coachAccessService';

interface CampRegistrationsManagerProps {
  visibleTabs?: CampTabId[];
}

const ALL_TABS = [
  { id: 'daily' as CampTabId, label: 'Daily Ops', shortLabel: 'Today', icon: CalendarCheck },
  { id: 'all' as CampTabId, label: 'All', shortLabel: 'All', icon: ClipboardList },
  { id: 'ground' as CampTabId, label: 'Ground', shortLabel: 'Ground', icon: UserPlus },
  { id: 'attendance' as CampTabId, label: 'Attendance', shortLabel: 'Mark', icon: Users },
  { id: 'history' as CampTabId, label: 'History', shortLabel: 'Hist', icon: History },
  { id: 'reports' as CampTabId, label: 'Reports', shortLabel: 'Reports', icon: BarChart3 },
  { id: 'payments' as CampTabId, label: 'Payments', shortLabel: 'Pay', icon: Receipt },
];

export const CampRegistrationsManager: React.FC<CampRegistrationsManagerProps> = ({ visibleTabs }) => {
  const tabs = useMemo(() => {
    if (!visibleTabs || visibleTabs.length === 0) return ALL_TABS;
    return ALL_TABS.filter(t => visibleTabs.includes(t.id));
  }, [visibleTabs]);

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || 'daily');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Camp Registrations</h2>
        <p className="text-muted-foreground">
          Manage camp registrations, attendance, and ground check-ins
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full h-auto gap-1`} style={{ gridTemplateColumns: `repeat(${Math.min(tabs.length, 7)}, 1fr)` }}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="daily">
          <DailyOperationsView />
        </TabsContent>
        <TabsContent value="all">
          <AllRegistrationsTab />
        </TabsContent>
        <TabsContent value="ground">
          <GroundRegistrationTab />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceMarkingTab />
        </TabsContent>
        <TabsContent value="history">
          <AttendanceHistoryTab />
        </TabsContent>
        <TabsContent value="reports">
          <CampReportsTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
