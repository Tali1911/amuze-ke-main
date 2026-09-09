import React, { useState, useEffect } from 'react';
import { getCustomers, getFrequentCustomers, sendEmailToCustomer, addCustomerVisit } from '@/services/customerService';
import { Customer } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Users, Mail, Star, Calendar, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [frequentCustomers, setFrequentCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    // Load customer data when component mounts
    const loadCustomers = () => {
      const allCustomers = getCustomers();
      const frequent = getFrequentCustomers();
      setCustomers(allCustomers);
      setFrequentCustomers(frequent);
    };

    loadCustomers();
    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(loadCustomers, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleSendEmail = async () => {
    if (!selectedCustomer) {
      toast({
        title: "No customer selected",
        description: "Please select a customer first",
        variant: "destructive",
      });
      return;
    }

    if (!emailData.subject || !emailData.message) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendEmailToCustomer(
        selectedCustomer.email,
        emailData.subject,
        emailData.message
      );
      
      toast({
        title: "Email sent successfully",
        description: "The email has been sent to the customer",
      });
      
      setEmailData({ subject: '', message: '' });
      setSelectedCustomer(null);
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "There was an error sending the email",
        variant: "destructive",
      });
    }
  };

  // Add demo customers if none exist
  const addDemoCustomers = () => {
    if (customers.length === 0) {
      const demoCustomers = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          programId: 'prog1',
          programName: 'Nature Explorer Camp'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-987-6543',
          programId: 'prog2',
          programName: 'Forest Guardians'
        },
        {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '555-567-8901',
          programId: 'prog1',
          programName: 'Nature Explorer Camp'
        }
      ];
      
      // Add multiple visits for some customers to make them "frequent"
      for (const customer of demoCustomers) {
        for (let i = 0; i < (customer.name === 'John Doe' ? 3 : 1); i++) {
          const visitDate = new Date();
          visitDate.setDate(visitDate.getDate() - i * 7); // One week apart
          
          addCustomerVisit(
            customer.name,
            customer.email,
            customer.phone,
            customer.programId,
            customer.programName
          );
        }
      }
      
      // Refresh the customer lists
      setCustomers(getCustomers());
      setFrequentCustomers(getFrequentCustomers());
      
      toast({
        title: "Demo customers added",
        description: "Sample customer data has been added for demonstration",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
        <Button onClick={addDemoCustomers} variant="outline">
          Add Demo Data
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Frequent Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{frequentCustomers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                if (frequentCustomers.length === 0) {
                  toast({
                    title: "No frequent customers",
                    description: "There are no customers with more than 2 visits",
                    variant: "destructive",
                  });
                  return;
                }
                setSelectedCustomer(frequentCustomers[0]);
              }}
            >
              Email Frequent Customers
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No customer data available</p>
              <Button onClick={addDemoCustomers}>Add Demo Customers</Button>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {customers.map(customer => (
                  <div 
                    key={customer.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                        <p className="text-sm">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Visits: {customer.totalVisits}</p>
                        <p className="text-xs text-gray-500">
                          Last visit: {new Date(customer.lastVisit).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Send Email to {selectedCustomer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Email message"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail}>
                  Send Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCustomer ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {selectedCustomer.visitHistory.map((visit) => (
                  <div key={visit.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{visit.programName}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(visit.date).toLocaleDateString()} at {new Date(visit.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Select a customer to view their visit history
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
