export interface Treatment {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // Duration in minutes
  created_at?: string; // Optional, for tracking when the treatment was created
}