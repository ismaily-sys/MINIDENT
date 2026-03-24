import { supabase } from '../lib/supabase';

/**
 * Patients Service
 * All methods include clinic_id filtering for multi-tenant security
 */
export const patientsService = {
  /**
   * Get all patients for a clinic
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<Array>} Array of patients
   */
  async getAll(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a single patient by ID
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - The patient ID
   * @returns {Promise<Object>} Patient object
   */
  async getById(clinicId, patientId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('id', patientId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Search patients by name, phone, or email
   * @param {string} clinicId - The clinic ID
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching patients
   */
  async search(clinicId, query) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(20);
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new patient
   * @param {string} clinicId - The clinic ID
   * @param {Object} patientData - Patient data (name, phone, email)
   * @returns {Promise<Object>} Created patient
   */
  async create(clinicId, patientData) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        clinic_id: clinicId,
        name: patientData.name,
        phone: patientData.phone || null,
        email: patientData.email || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a patient
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - The patient ID
   * @param {Object} patientData - Updated patient data
   * @returns {Promise<Object>} Updated patient
   */
  async update(clinicId, patientId, patientData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    
    const { data, error } = await supabase
      .from('patients')
      .update({
        name: patientData.name,
        phone: patientData.phone || null,
        email: patientData.email || null,
      })
      .eq('clinic_id', clinicId)
      .eq('id', patientId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a patient
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - The patient ID
   */
  async delete(clinicId, patientId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('id', patientId);
    
    if (error) throw error;
  },

  /**
   * Get patient statistics
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<Object>} Patient statistics
   */
  async getStats(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    
    if (error) throw error;
    return { total: count };
  },
};

export default patientsService;
