import { supabase } from '../lib/supabase';

/**
 * Appointments Service
 * All methods include clinic_id filtering for multi-tenant security
 * Handles date/time conversion for the 'date' timestamp field
 */
export const appointmentsService = {
  /**
   * Get all appointments for a clinic
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<Array>} Array of appointments with patient data
   */
  async getAll(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get appointments for a specific date
   * @param {string} clinicId - The clinic ID
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of appointments for that date
   */
  async getByDate(clinicId, date) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!date) throw new Error('date is required');
    
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get appointments for a date range
   * @param {string} clinicId - The clinic ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of appointments in range
   */
  async getByDateRange(clinicId, startDate, endDate) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .gte('date', `${startDate}T00:00:00`)
      .lte('date', `${endDate}T23:59:59`)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a single appointment by ID
   * @param {string} clinicId - The clinic ID
   * @param {string} appointmentId - The appointment ID
   * @returns {Promise<Object>} Appointment with patient data
   */
  async getById(clinicId, appointmentId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!appointmentId) throw new Error('appointmentId is required');
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .eq('id', appointmentId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get appointments for a specific patient
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - The patient ID
   * @returns {Promise<Array>} Array of patient's appointments
   */
  async getByPatient(clinicId, patientId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new appointment
   * @param {string} clinicId - The clinic ID
   * @param {Object} formData - Appointment form data
   * @param {string} formData.patient_id - Patient ID
   * @param {string} formData.date - Date string (YYYY-MM-DD)
   * @param {string} formData.time - Time string (HH:MM)
   * @param {string} [formData.status] - Appointment status
   * @param {string} [formData.notes] - Appointment notes
   * @returns {Promise<Object>} Created appointment
   */
  async create(clinicId, formData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!formData.patient_id) throw new Error('patient_id is required');
    if (!formData.date) throw new Error('date is required');
    if (!formData.time) throw new Error('time is required');
    
    // Convert date + time to timestamp
    const timestamp = `${formData.date}T${formData.time}:00`;
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: formData.patient_id,
        date: timestamp,
        status: formData.status || 'pending',
        notes: formData.notes || null,
      })
      .select('*, patient:patients(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update an appointment
   * @param {string} clinicId - The clinic ID
   * @param {string} appointmentId - The appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated appointment
   */
  async update(clinicId, appointmentId, updateData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!appointmentId) throw new Error('appointmentId is required');
    
    // If date and time are provided, convert to timestamp
    if (updateData.date && updateData.time) {
      updateData.date = `${updateData.date}T${updateData.time}:00`;
      delete updateData.time;
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('clinic_id', clinicId)
      .eq('id', appointmentId)
      .select('*, patient:patients(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update appointment status
   * @param {string} clinicId - The clinic ID
   * @param {string} appointmentId - The appointment ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated appointment
   */
  async updateStatus(clinicId, appointmentId, status) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!appointmentId) throw new Error('appointmentId is required');
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      throw new Error('Invalid status');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('clinic_id', clinicId)
      .eq('id', appointmentId)
      .select('*, patient:patients(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete an appointment
   * @param {string} clinicId - The clinic ID
   * @param {string} appointmentId - The appointment ID
   */
  async delete(clinicId, appointmentId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!appointmentId) throw new Error('appointmentId is required');
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('id', appointmentId);
    
    if (error) throw error;
  },

  /**
   * Get today's appointments count
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<number>} Count of today's appointments
   */
  async getTodayCount(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;
    
    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('date', startOfDay)
      .lte('date', endOfDay);
    
    if (error) throw error;
    return count;
  },

  /**
   * Get upcoming appointments
   * @param {string} clinicId - The clinic ID
   * @param {number} [limit=5] - Maximum number to return
   * @returns {Promise<Array>} Upcoming appointments
   */
  async getUpcoming(clinicId, limit = 5) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .gte('date', now)
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  /**
   * Extract time from timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Time in HH:MM format
   */
  extractTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Extract date from timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Date in YYYY-MM-DD format
   */
  extractDate(timestamp) {
    if (!timestamp) return '';
    return timestamp.split('T')[0];
  },

  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted date and time
   */
  formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};

export default appointmentsService;
