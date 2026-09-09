import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Wallet, TrendingUp, AlertTriangle, Trash2 } from "lucide-react";
import { financialService, Budget } from '@/services/financialService';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ACTIVITY_CATEGORIES, DEPARTMENT_LIST, smartCapitalize } from '@/lib/activityCategories';
import { useActivityCategories } from '@/hooks/useActivityCategories';

const BudgetManagement = () => {
  useActivityCategories();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customCategory, setCustomCategory] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    allocated_amount: '',
    period_start: '',
    period_end: '',
    department: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const budgetsData = await financialService.getBudgets();
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEffectiveCategory = () => {
    return formData.category === 'Others' ? customCategory : formData.category;
  };

  const getEffectiveDepartment = () => {
    return formData.department === 'Others' ? customDepartment : formData.department;
  };

  const handleCreateBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newBudget = {
        name: formData.name,
        category: getEffectiveCategory(),
        allocated_amount: parseFloat(formData.allocated_amount),
        period_start: formData.period_start,
        period_end: formData.period_end,
        department: getEffectiveDepartment(),
        status: 'active' as const,
        notes: formData.notes,
        created_by: user?.id
      };

      await financialService.createBudget(newBudget);
      await loadData();
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        category: '',
        allocated_amount: '',
        period_start: '',
        period_end: '',
        department: '',
        notes: ''
      });
      setCustomCategory('');
      setCustomDepartment('');

      toast({
        title: "Success",
        description: "Budget created successfully.",
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: "Failed to create budget.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudget = async (budget: Budget) => {
    try {
      await financialService.deleteBudget(budget.id);
      await loadData();
      toast({
        title: "Deleted",
        description: `Budget "${budget.name}" deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Budget['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'exceeded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationPercentage = (budget: Budget) => {
    return Math.min((Number(budget.spent_amount) / Number(budget.allocated_amount)) * 100, 100);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading budgets...</div>;
  }

  const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocated_amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount), 0);
  const activeBudgets = budgets.filter(b => b.status === 'active').length;
  const exceededBudgets = budgets.filter(b => b.status === 'exceeded').length;

  const isFormValid = formData.name && getEffectiveCategory() && formData.allocated_amount && formData.period_start && formData.period_end;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Budget Management</h2>
          <p className="text-sm text-muted-foreground">Track department budgets</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>Set up a new budget allocation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Budget Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Q1 Marketing Budget"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => {
                    setFormData({...formData, category: value});
                    if (value !== 'Others') setCustomCategory('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...ACTIVITY_CATEGORIES].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.category === 'Others' && (
                    <Input
                      className="mt-2"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(smartCapitalize(e.target.value))}
                      placeholder="Enter category name"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => {
                    setFormData({...formData, department: value});
                    if (value !== 'Others') setCustomDepartment('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_LIST.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.department === 'Others' && (
                    <Input
                      className="mt-2"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(smartCapitalize(e.target.value))}
                      placeholder="Enter department name"
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="allocated_amount">Allocated Amount (KES) *</Label>
                <Input
                  id="allocated_amount"
                  type="number"
                  value={formData.allocated_amount}
                  onChange={(e) => setFormData({...formData, allocated_amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period_start">Start *</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="period_end">End *</Label>
                  <Input
                    id="period_end"
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBudget}
                disabled={!isFormValid}
                className="w-full sm:w-auto"
              >
                Create Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Allocated</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">KES {(totalAllocated / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">KES {(totalSpent / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{activeBudgets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Exceeded</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500 hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{exceededBudgets}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Budgets</CardTitle>
          <CardDescription className="hidden sm:block">Monitor allocations and spending</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budgets created yet.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-border">
                {budgets.map((budget) => {
                  const utilization = getUtilizationPercentage(budget);
                  return (
                    <div key={budget.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{budget.name}</div>
                          <div className="text-sm text-muted-foreground">{budget.category}</div>
                        </div>
                        <Badge className={getStatusColor(budget.status)}>
                          {budget.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>KES {Number(budget.spent_amount).toLocaleString()}</span>
                          <span className="text-muted-foreground">of KES {Number(budget.allocated_amount).toLocaleString()}</span>
                        </div>
                        <Progress value={utilization} className="h-2" />
                        <span className="text-xs text-muted-foreground">{utilization.toFixed(1)}% used</span>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBudget(budget)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Department</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead className="hidden md:table-cell">Spent</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => {
                      const utilization = getUtilizationPercentage(budget);
                      return (
                        <TableRow key={budget.id}>
                          <TableCell className="font-medium">{budget.name}</TableCell>
                          <TableCell>{budget.category}</TableCell>
                          <TableCell className="hidden md:table-cell">{budget.department || '-'}</TableCell>
                          <TableCell>KES {Number(budget.allocated_amount).toLocaleString()}</TableCell>
                          <TableCell className="hidden md:table-cell">KES {Number(budget.spent_amount).toLocaleString()}</TableCell>
                          <TableCell className="w-32">
                            <div className="space-y-1">
                              <Progress value={utilization} className="h-2" />
                              <span className="text-xs text-muted-foreground">{utilization.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(budget.status)}>
                              {budget.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteBudget(budget)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetManagement;
