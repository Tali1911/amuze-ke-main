
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderTabProps {
  title: string;
  description: string;
  message: string;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, description, message }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8 text-muted-foreground">
        {message}
      </div>
    </CardContent>
  </Card>
);

export const RecruitmentTab = () => (
  <PlaceholderTab
    title="Recruitment Management"
    description="Manage job postings and applications"
    message="Recruitment management system will be implemented next"
  />
);

export const PerformanceTab = () => (
  <PlaceholderTab
    title="Performance Management"
    description="Track employee performance and reviews"
    message="Performance management system will be implemented next"
  />
);

export const TrainingTab = () => (
  <PlaceholderTab
    title="Training Management"
    description="Manage employee training and development"
    message="Training management system will be implemented next"
  />
);

export const HRReportsTab = () => (
  <PlaceholderTab
    title="HR Reports"
    description="Generate HR analytics and reports"
    message="HR reporting system will be implemented next"
  />
);
