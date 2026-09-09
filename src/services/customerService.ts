
import { Customer, CustomerVisit } from '@/types/customer';
import { v4 as uuidv4 } from 'uuid';

// Get all customers
export const getCustomers = (): Customer[] => {
  const customers = localStorage.getItem('customers');
  return customers ? JSON.parse(customers) : [];
};

// Get frequent customers (more than 2 visits)
export const getFrequentCustomers = (): Customer[] => {
  const customers = getCustomers();
  return customers.filter(customer => customer.totalVisits > 2);
};

// Add new customer visit
export const addCustomerVisit = (
  name: string,
  email: string,
  phone: string,
  programId: string,
  programName: string
): Customer => {
  const customers = getCustomers();
  const now = new Date().toISOString();
  
  // Check if customer exists
  let customer = customers.find(c => c.email === email);
  
  const visit: CustomerVisit = {
    id: uuidv4(),
    customerId: customer?.id || uuidv4(),
    date: now,
    programId,
    programName
  };

  if (customer) {
    // Update existing customer
    customer.lastVisit = now;
    customer.totalVisits++;
    customer.visitHistory.push(visit);
    customer.phone = phone; // Update phone in case it changed
  } else {
    // Create new customer
    customer = {
      id: visit.customerId,
      name,
      email,
      phone,
      firstVisit: now,
      lastVisit: now,
      totalVisits: 1,
      visitHistory: [visit]
    };
    customers.push(customer);
  }

  localStorage.setItem('customers', JSON.stringify(customers));
  return customer;
};

// Send email to customer (demo function)
export const sendEmailToCustomer = async (
  customerEmail: string,
  subject: string,
  message: string
): Promise<boolean> => {
  // In a real app, this would connect to an email service
  console.log(`Sending email to ${customerEmail}:`, { subject, message });
  
  // Store email in local storage for demo
  const emails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
  emails.push({
    id: uuidv4(),
    to: customerEmail,
    subject,
    message,
    sentAt: new Date().toISOString()
  });
  localStorage.setItem('sentEmails', JSON.stringify(emails));
  
  return true;
};

// Add demo customer data
export const addDemoCustomerData = () => {
  const customers = getCustomers();
  
  if (customers.length === 0) {
    // Create some demo customer data
    const demoCustomers = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '555-123-4567',
        programId: 'program1',
        programName: 'Nature Explorer Camp'
      },
      {
        name: 'Emily Johnson',
        email: 'emily@example.com',
        phone: '555-234-5678',
        programId: 'program2',
        programName: 'Forest Guardians'
      },
      {
        name: 'Michael Brown',
        email: 'michael@example.com',
        phone: '555-345-6789',
        programId: 'program1',
        programName: 'Nature Explorer Camp'
      }
    ];
    
    // Add multiple visits for each customer
    demoCustomers.forEach(customer => {
      // First visit - a month ago
      const date1 = new Date();
      date1.setMonth(date1.getMonth() - 1);
      
      // Create customer with first visit
      const newCustomer = {
        id: uuidv4(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        firstVisit: date1.toISOString(),
        lastVisit: date1.toISOString(),
        totalVisits: 1,
        visitHistory: [
          {
            id: uuidv4(),
            customerId: '',  // Will be set below
            date: date1.toISOString(),
            programId: customer.programId,
            programName: customer.programName
          }
        ]
      };
      
      // Set customer ID in first visit
      newCustomer.visitHistory[0].customerId = newCustomer.id;
      
      // Add 2-4 more visits for frequent customers
      const visitCount = customer.name === 'John Smith' ? 4 : 
                        customer.name === 'Emily Johnson' ? 3 : 1;
      
      for (let i = 1; i < visitCount; i++) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - (i * 7)); // Weekly visits
        
        const visit: CustomerVisit = {
          id: uuidv4(),
          customerId: newCustomer.id,
          date: visitDate.toISOString(),
          programId: customer.programId,
          programName: customer.programName
        };
        
        newCustomer.visitHistory.push(visit);
        newCustomer.totalVisits++;
        
        if (visitDate > new Date(newCustomer.lastVisit)) {
          newCustomer.lastVisit = visitDate.toISOString();
        }
      }
      
      customers.push(newCustomer);
    });
    
    localStorage.setItem('customers', JSON.stringify(customers));
  }
  
  return customers;
};

// Clear all customer data
export const clearCustomerData = () => {
  localStorage.removeItem('customers');
  localStorage.removeItem('sentEmails');
};
