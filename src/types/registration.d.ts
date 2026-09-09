
export interface ChildRegistration {
  childName: string;
  childAge: string;
  timeSlot: 'morning' | 'afternoon' | 'fullDay' | 'weeklong';
  amount: number;
  programId: string;
  programName: string;
  ageGroup?: string;
}

export interface Registration {
  id?: string;
  parentName: string;
  email: string;
  phone: string;
  programId: string;
  children: ChildRegistration[];
  totalAmount: number;
  paymentMethod: 'card' | 'mpesa';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  poster?: string;
  createdAt?: Date;
}
