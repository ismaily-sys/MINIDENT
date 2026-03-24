import { supabase } from './supabaseClient';

/**
 * Service for managing patient-related operations
 */
export const patientService = {
  // Fetch all patients from the database
  getAll: async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  },

  // Fetch a patient by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Create a new patient
  create: async (patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData]);

    if (error) throw new Error(error.message);
    return data[0];
  },

  // Update an existing patient
  update: async (id, patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data[0];
  },

  // Delete a patient
  delete: async (id) => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};