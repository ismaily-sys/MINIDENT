import { supabase } from '../lib/supabase';

/**
 * Invoices Service
 * All methods include clinic_id filtering for multi-tenant security
 * Manual invoice creation (not auto-generated from treatments)
 */
export const invoicesService = {
  /**
   * Get all invoices for a clinic
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<Array>} Array of invoices with patient data
   */
  async getAll(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a single invoice by ID with items
   * @param {string} clinicId - The clinic ID
   * @param {string} invoiceId - The invoice ID
   * @returns {Promise<Object>} Invoice with patient and items
   */
  async getById(clinicId, invoiceId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!invoiceId) throw new Error('invoiceId is required');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*, patient:patients(*), items:invoice_items(*)')
      .eq('clinic_id', clinicId)
      .eq('id', invoiceId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get invoices for a specific patient
   * @param {string} clinicId - The clinic ID
   * @param {string} patientId - The patient ID
   * @returns {Promise<Array>} Array of patient's invoices
   */
  async getByPatient(clinicId, patientId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!patientId) throw new Error('patientId is required');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get invoices by status
   * @param {string} clinicId - The clinic ID
   * @param {string} status - Invoice status
   * @returns {Promise<Array>} Array of invoices with status
   */
  async getByStatus(clinicId, status) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!status) throw new Error('status is required');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*, patient:patients(*)')
      .eq('clinic_id', clinicId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new invoice with items
   * @param {string} clinicId - The clinic ID
   * @param {Object} formData - Invoice form data
   * @param {string} formData.patient_id - Patient ID
   * @param {Array} formData.items - Array of invoice items
   * @param {string} [formData.notes] - Invoice notes
   * @returns {Promise<Object>} Created invoice with items
   */
  async create(clinicId, formData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!formData.patient_id) throw new Error('patient_id is required');
    if (!formData.items || formData.items.length === 0) {
      throw new Error('At least one item is required');
    }
    
    // Calculate total
    const total = formData.items.reduce((sum, item) => sum + Number(item.price), 0);
    
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: formData.patient_id,
        total,
        status: 'unpaid',
        notes: formData.notes || null,
      })
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Create invoice items
    const itemsToInsert = formData.items.map(item => ({
      invoice_id: invoice.id,
      treatment_id: item.treatment_id || null,
      description: item.description,
      price: item.price,
    }));
    
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();
    
    if (itemsError) throw itemsError;
    
    return { ...invoice, items };
  },

  /**
   * Update an invoice
   * @param {string} clinicId - The clinic ID
   * @param {string} invoiceId - The invoice ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated invoice
   */
  async update(clinicId, invoiceId, updateData) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!invoiceId) throw new Error('invoiceId is required');
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('clinic_id', clinicId)
      .eq('id', invoiceId)
      .select('*, patient:patients(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update invoice status
   * @param {string} clinicId - The clinic ID
   * @param {string} invoiceId - The invoice ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated invoice
   */
  async updateStatus(clinicId, invoiceId, status) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!invoiceId) throw new Error('invoiceId is required');
    if (!['unpaid', 'paid', 'cancelled'].includes(status)) {
      throw new Error('Invalid status');
    }
    
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('clinic_id', clinicId)
      .eq('id', invoiceId)
      .select('*, patient:patients(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete an invoice (and its items)
   * @param {string} clinicId - The clinic ID
   * @param {string} invoiceId - The invoice ID
   */
  async delete(clinicId, invoiceId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!invoiceId) throw new Error('invoiceId is required');
    
    // Invoice items will be deleted automatically via cascade
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('id', invoiceId);
    
    if (error) throw error;
  },

  /**
   * Add item to invoice
   * @param {string} clinicId - The clinic ID
   * @param {string} invoiceId - The invoice ID
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Created item
   */
  async addItem(clinicId, invoiceId, item) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!invoiceId) throw new Error('invoiceId is required');
    
    // Verify invoice belongs to clinic
    const invoice = await this.getById(clinicId, invoiceId);
    
    const { data, error } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoiceId,
        treatment_id: item.treatment_id || null,
        description: item.description,
        price: item.price,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update invoice total
    const newTotal = Number(invoice.total) + Number(item.price);
    await this.update(clinicId, invoiceId, { total: newTotal });
    
    return data;
  },

  /**
   * Remove item from invoice
   * @param {string} clinicId - The clinic ID
   * @param {string} invoiceId - The invoice ID
   * @param {string} itemId - The item ID
   */
  async removeItem(clinicId, invoiceId, itemId) {
    if (!clinicId) throw new Error('clinicId is required');
    if (!invoiceId) throw new Error('invoiceId is required');
    if (!itemId) throw new Error('itemId is required');
    
    // Get invoice and item
    const invoice = await this.getById(clinicId, invoiceId);
    const item = invoice.items.find(i => i.id === itemId);
    
    if (!item) throw new Error('Item not found');
    
    // Delete item
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
    
    // Update invoice total
    const newTotal = Number(invoice.total) - Number(item.price);
    await this.update(clinicId, invoiceId, { total: newTotal });
  },

  /**
   * Get pending invoices count
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<number>} Count of pending invoices
   */
  async getPendingCount(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'unpaid');
    
    if (error) throw error;
    return count;
  },

  /**
   * Get total unpaid amount
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<number>} Total unpaid amount
   */
  async getTotalUnpaid(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('total')
      .eq('clinic_id', clinicId)
      .eq('status', 'unpaid');
    
    if (error) throw error;
    
    return data.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  },

  /**
   * Generate invoice number
   * @param {string} clinicId - The clinic ID
   * @returns {Promise<string>} Invoice number
   */
  async generateInvoiceNumber(clinicId) {
    if (!clinicId) throw new Error('clinicId is required');
    
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    
    if (error) throw error;
    
    const year = new Date().getFullYear();
    const number = String((count || 0) + 1).padStart(4, '0');
    return `INV-${year}-${number}`;
  },
};

export default invoicesService;
