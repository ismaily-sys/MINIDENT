import { supabase } from './supabaseClient';

/**
 * Service for managing treatment-related operations
 */
export const treatmentService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('treatments')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (treatment) => {
    const { data, error } = await supabase
      .from('treatments')
      .insert([treatment]);

    if (error) throw new Error(error.message);
    return data[0];
  },

  update: async (id, treatment) => {
    const { data, error } = await supabase
      .from('treatments')
      .update(treatment)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};