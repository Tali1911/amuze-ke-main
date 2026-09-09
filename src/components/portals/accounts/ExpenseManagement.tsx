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
import { Plus, Receipt, Clock, CheckCircle, XCircle, Trash2, Upload, Paperclip, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { financialService, Expense, Budget } from '@/services/financialService';
import { receiptService } from '@/services/receiptService';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ACTIVITY_CATEGORIES, DEPARTMENT_LIST, smartCapitalize } from '@/lib/activityCategories';
import { useActivityCategories } from '@/hooks/useActivityCategories';
import ReceiptsInbox from './ReceiptsInbox';

const ExpenseManagement = () => {
  useActivityCategories();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customCategory, setCustomCategory] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    department: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    budget_id: '',
    notes: '',
    receipt_url: '',
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [rowUploadingId, setRowUploadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, budgetsData] = await Promise.all([
        financialService.getExpenses(),
        financialService.getActiveBudgets()
      ]);
      setExpenses(expensesData);
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load expense data.",
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

  // When a budget is selected, auto-fill category and department
  const handleBudgetSelect = (budgetId: string) => {
    setFormData(prev => ({ ...prev, budget_id: budgetId }));
    const selectedBudget = budgets.find(b => b.id === budgetId);
    if (selectedBudget) {
      const isActivityCat = ACTIVITY_CATEGORIES.includes(selectedBudget.category);
      const isDeptInList = DEPARTMENT_LIST.includes(selectedBudget.department || '');
      
      setFormData(prev => ({
        ...prev,
        budget_id: budgetId,
        category: isActivityCat ? selectedBudget.category : 'Others',
        department: isDeptInList ? (selectedBudget.department || '') : (selectedBudget.department ? 'Others' : ''),
      }));
      
      if (!isActivityCat) setCustomCategory(selectedBudget.category);
      if (selectedBudget.department && !isDeptInList) setCustomDepartment(selectedBudget.department);
    }
  };

  const handleCreateExpense = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newExpense = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: getEffectiveCategory(),
        department: getEffectiveDepartment(),
        expense_date: formData.expense_date,
        vendor: formData.vendor,
        budget_id: formData.budget_id || undefined,
        receipt_url: formData.receipt_url || undefined,
        status: 'pending' as const,
        notes: formData.notes,
        created_by: user?.id
      };

      await financialService.createExpense(newExpense);
      await loadData();
      setIsCreateDialogOpen(false);
      setFormData({
        description: '',
        amount: '',
        category: '',
        department: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        budget_id: '',
        notes: '',
        receipt_url: '',
      });
      setCustomCategory('');
      setCustomDepartment('');

      toast({
        title: "Success",
        description: "Expense submitted for approval.",
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to submit expense.",
        variant: "destructive",
      });
    }
  };

  const handleApproveExpense = async (expense: Expense) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await financialService.approveExpense(expense.id, user.id);
      await loadData();
      toast({
        title: "Approved",
        description: "Expense has been approved and budget updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve expense.",
        variant: "destructive",
      });
    }
  };

  const handleRejectExpense = async (expense: Expense) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await financialService.rejectExpense(expense.id, user.id);
      await loadData();
      toast({
        title: "Rejected",
        description: "Expense has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject expense.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await financialService.deleteExpense(expense.id);
      await loadData();
      toast({
        title: "Deleted",
        description: "Expense deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading expenses...</div>;
  }

  const totalExpenses = expenses
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const pendingTotal = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const isFormValid = formData.description && formData.amount && getEffectiveCategory() && formData.expense_date && formData.budget_id;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Expense Management</h2>
          <p className="text-sm text-muted-foreground">Track and approve expenses</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Submit Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Submit Expense</DialogTitle>
              <DialogDescription>Submit an expense against a budget allocation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget_id">Link to Budget *</Label>
                <Select value={formData.budget_id} onValueChange={handleBudgetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.length === 0 ? (
                      <SelectItem value="__none" disabled>No active budgets</SelectItem>
                    ) : (
                      budgets.map(budget => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.name} (KES {(Number(budget.allocated_amount) - Number(budget.spent_amount)).toLocaleString()} remaining)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Expense description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (KES) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="expense_date">Date *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => {
                    setFormData({...formData, category: value});
                    if (value !== 'Others') setCustomCategory('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                  <Label htmlFor="department">Dept</Label>
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
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  placeholder="Vendor name"
                />
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
              <div>
                <Label>Receipt (optional)</Label>
                {formData.receipt_url ? (
                  <div className="flex items-center gap-2 p-2 border rounded mt-1">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <a href={formData.receipt_url} target="_blank" rel="noreferrer" className="text-sm hover:underline truncate flex-1">
                      View attached receipt
                    </a>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, receipt_url: '' })}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-2 border border-dashed rounded mt-1 cursor-pointer hover:bg-muted/40">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{uploadingReceipt ? 'Uploading…' : 'Click to upload receipt (JPG/PNG/PDF)'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={uploadingReceipt}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setUploadingReceipt(true);
                        try {
                          const { url } = await receiptService.uploadFile(f);
                          setFormData(prev => ({ ...prev, receipt_url: url }));
                        } catch (err: any) {
                          toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                        } finally {
                          setUploadingReceipt(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateExpense}
                disabled={!isFormValid}
                className="w-full sm:w-auto"
              >
                Submit Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="receipts">Receipts Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">KES {totalExpenses.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{pendingExpenses.length}</div>
                <p className="text-xs text-muted-foreground">KES {pendingTotal.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{expenses.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Expenses</CardTitle>
              <CardDescription className="hidden sm:block">Review and approve submissions</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses submitted yet.
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="sm:hidden divide-y divide-border">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{expense.description}</div>
                            <div className="text-sm text-muted-foreground">{expense.category}</div>
                          </div>
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">KES {Number(expense.amount).toLocaleString()}</span>
                          <span className="text-muted-foreground">{new Date(expense.expense_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 pt-2 items-center">
                          {expense.receipt_url ? (
                            <a href={expense.receipt_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                              <Paperclip className="h-3 w-3" /> Receipt
                            </a>
                          ) : (
                            <label className="text-xs flex items-center gap-1 text-muted-foreground cursor-pointer">
                              <Upload className="h-3 w-3" /> {rowUploadingId === expense.id ? 'Uploading…' : 'Attach'}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  setRowUploadingId(expense.id);
                                  try {
                                    const { url } = await receiptService.uploadFile(f);
                                    await financialService.updateExpense(expense.id, { receipt_url: url });
                                    await loadData();
                                  } catch (err: any) {
                                    toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                                  } finally {
                                    setRowUploadingId(null);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          )}
                          {expense.status === 'pending' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleApproveExpense(expense)}>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleRejectExpense(expense)}>
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDeleteExpense(expense)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="hidden md:table-cell">Vendor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell className="hidden md:table-cell">{expense.vendor || '-'}</TableCell>
                            <TableCell>KES {Number(expense.amount).toLocaleString()}</TableCell>
                            <TableCell>
                              {expense.receipt_url ? (
                                <a href={expense.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                  <ExternalLink className="h-3 w-3" /> View
                                </a>
                              ) : (
                                <label className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  <Upload className="h-3 w-3" /> {rowUploadingId === expense.id ? 'Uploading…' : 'Attach'}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    onChange={async (e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      setRowUploadingId(expense.id);
                                      try {
                                        const { url } = await receiptService.uploadFile(f);
                                        await financialService.updateExpense(expense.id, { receipt_url: url });
                                        await loadData();
                                      } catch (err: any) {
                                        toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                                      } finally {
                                        setRowUploadingId(null);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(expense.status)}>
                                {expense.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {expense.status === 'pending' && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleApproveExpense(expense)}>
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleRejectExpense(expense)}>
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleDeleteExpense(expense)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <ReceiptsInbox onMatched={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseManagement;
