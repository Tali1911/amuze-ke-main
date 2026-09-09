
export interface CustomerVisit {
  id: string;
  customerId: string;
  date: string;
  programId: string;
  programName: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  firstVisit: string;
  lastVisit: string;
  totalVisits: number;
  visitHistory: CustomerVisit[];
}
