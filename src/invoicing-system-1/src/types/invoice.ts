export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  total: number;
  status: 'pending' | 'paid' | 'canceled';
  created_at: string;
}