import { supabase } from '../lib/supabase';

/**
 * Treatments Service
 * All methods include clinic_id filtering for multi-tenant security
 * Uses 'code' field to reference dental_codes table
 */
export const treatmentsService = {
  /**
   * Get all treatments for a clinic
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<Array>} Array of treatments with patient and dental code data
   */
  async getAll(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('treatments')
      .select('*, patient:patients(*), dental_code:dental_codes(*)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a single treatment by ID
   * @param {string} clinicId - The clinic ID
   * @param {string} treatmentId - The treatment ID
   * @returns {Promise<Object>} Treatment with patient and dental code data
   */
  async getById(clinicId, treatmentId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!treatmentId) throw new Error('treatmentId is required');
    
    const { data, error } = await supabase
      .from('treatments')
      .select('*, patient:patients(*), dental_code:dental_codes(*), appointment:appointments(*)')
      .eq('clinic_id', clinicId)
      .eq('id', treatmentId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get treatments for a specific patient
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - The patient ID
   * @returns {Promise<Array>} Array of patient's treatments
   */
  async getByPatient(clinicId, patientId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    
    const { data, error } = await supabase
      .from('treatments')
      .select('*, dental_code:dental_codes(*)')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get treatments for a specific appointment
   * @param {string} clinicId - The clinic ID
   * @param {string} appointmentId - The appointment ID
   * @returns {Promise<Array>} Array of appointment's treatments
   */
  async getByAppointment(clinicId, appointmentId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!appointmentId) throw new Error('appointmentId is required');
    
    const { data, error } = await supabase
      .from('treatments')
      .select('*, dental_code:dental_codes(*)')
      .eq('clinic_id', clinicId)
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new treatment
   * @param {string} clinicId - The clinic ID
   * @param {Object} formData - Treatment form data
   * @param {string} formData.patient_id - Patient ID
   * @param {string} [formData.appointment_id] - Appointment ID
   * @param {string} formData.code - Dental code reference
   * @param {string} formData.description - Treatment description
   * @param {number} formData.price - Treatment price
   * @returns {Promise<Object>} Created treatment
   */
  async create(clinicId, formData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!formData.patient_id) throw new Error('patient_id is required');
    if (!formData.description) throw new Error('description is required');
    if (formData.price === undefined || formData.price === null) {
      throw new Error('price is required');
    }
    
    const { data, error } = await supabase
      .from('treatments')
      .insert({
        clinic_id: clinicId,
        patient_id: formData.patient_id,
        appointment_id: formData.appointment_id || null,
        code: formData.code || null,  // References dental_codes.code
        description: formData.description,
        price: formData.price,
      })
      .select('*, patient:patients(*), dental_code:dental_codes(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create treatment from dental code
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - Patient ID
   * @param {string} code - Dental code
   * @param {string} [appointmentId] - Optional appointment ID
   * @returns {Promise<Object>} Created treatment
   */
  async createFromCode(clinicId, patientId, code, appointmentId = null) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    if (!code) throw new Error('code is required');
    
    // Get dental code details
    const { data: dentalCode, error: codeError } = await supabase
      .from('dental_codes')
      .select('*')
      .eq('code', code)
      .single();
    
    if (codeError) throw codeError;
    
    return this.create(clinicId, {
      patient_id: patientId,
      appointment_id: appointmentId,
      code: dentalCode.code,
      description: dentalCode.description,
      price: dentalCode.default_price || 0,
    });
  },

  /**
   * Update a treatment
   * @param {string} clinicId - The clinic ID
   * @param {string} treatmentId - The treatment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated treatment
   */
  async update(clinicId, treatmentId, updateData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!treatmentId) throw new Error('treatmentId is required');
    
    const { data, error } = await supabase
      .from('treatments')
      .update(updateData)
      .eq('clinic_id', clinicId)
      .eq('id', treatmentId)
      .select('*, patient:patients(*), dental_code:dental_codes(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a treatment
   * @param {string} clinicId - The clinic ID
   * @param {string} treatmentId - The treatment ID
   */
  async delete(clinicId, treatmentId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!treatmentId) throw new Error('treatmentId is required');
    
    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('id', treatmentId);
    
    if (error) throw error;
  },

  /**
   * Get total revenue for a clinic
   * @param {string} clinicId - The clinic ID
   * @param {string} [startDate] - Optional start date
   * @param {string} [endDate] - Optional end date
   * @returns {Promise<number>} Total revenue
   */
  async getTotalRevenue(clinicId, startDate = null, endDate = null) {
    if (!clinicId) throw new Error('clinicId is required');
    
    let query = supabase
      .from('treatments')
      .select('price')
      .eq('clinic_id', clinicId);
    
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.reduce((sum, treatment) => sum + Number(treatment.price), 0);
  },

  /**
   * Get monthly revenue for a clinic
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<number>} Monthly revenue
   */
  async getMonthlyRevenue(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    
    return this.getTotalRevenue(clinicId, startDate, endDate);
  },
};

export default treatmentsService;
