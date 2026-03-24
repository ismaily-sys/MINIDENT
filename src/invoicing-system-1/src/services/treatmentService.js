import { supabase } from './supabaseClient';

/**
 * Service for handling treatment-related operations
 */
export const treatmentService = {
  /**
   * Fetch all treatments from the database
   * @returns {Promise<Array>} List of treatments
   */
  async getAll() {
    const { data, error } = await supabase
      .from('treatments')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Fetch a specific treatment by ID
   * @param {string} id - The ID of the treatment
   * @returns {Promise<Object>} Treatment data
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};