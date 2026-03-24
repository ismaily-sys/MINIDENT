export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Treatment {
  id: string;
  name: string;
  price: number;
}

export interface InvoiceItem {
  treatment: Treatment;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  patient: Patient;
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;
}