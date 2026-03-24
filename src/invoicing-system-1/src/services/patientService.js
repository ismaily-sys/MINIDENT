import { supabase } from './supabaseClient';

export const patientService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  create: async (patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData]);

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  },

  update: async (id, patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
};