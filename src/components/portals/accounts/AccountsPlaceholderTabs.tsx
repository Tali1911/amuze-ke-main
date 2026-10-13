
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

export const PaymentsTab = () => (
  <PlaceholderTab
    title="Payment Management"
    description="Track and process payments"
    message="Payment management system will be implemented next"
  />
);

export const BudgetTab = () => (
  <PlaceholderTab
    title="Budget Management"
    description="Plan and track budgets"
    message="Budget management system will be implemented next"
  />
);

export const ExpensesTab = () => (
  <PlaceholderTab
    title="Expense Management"
    description="Track and approve expenses"
    message="Expense management system will be implemented next"
  />
);
