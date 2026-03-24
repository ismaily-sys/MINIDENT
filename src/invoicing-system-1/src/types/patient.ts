export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  email: string;
  phone: string;
  address: string;
  createdAt: string; // Format: ISO string
  updatedAt: string; // Format: ISO string
}