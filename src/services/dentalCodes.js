import { supabase } from '../lib/supabase';

/**
 * Dental Codes Service
 * Reference data - shared across all clinics
 * Uses 'code' as primary key (no id field)
 */
export const dentalCodesService = {
  /**
   * Get all dental codes
   * @returns {Promise<Array>} Array of dental codes
   */
  async getAll() {
    const { data, error } = await supabase
      .from('dental_codes')
      .select('*')
      .order('category', { ascending: true })
      .order('code', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a single dental code by code (primary key)
   * @param {string} code - The dental code
   * @returns {Promise<Object>} Dental code object
   */
  async getByCode(code) {
    if (!code) throw new Error('code is required');
    
    const { data, error } = await supabase
      .from('dental_codes')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get dental codes by category
   * @param {string} category - The category name
   * @returns {Promise<Array>} Array of dental codes in category
   */
  async getByCategory(category) {
    if (!category) throw new Error('category is required');
    
    const { data, error } = await supabase
      .from('dental_codes')
      .select('*')
      .eq('category', category)
      .order('code', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get all unique categories
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('dental_codes')
      .select('category')
      .order('category', { ascending: true });
    
    if (error) throw error;
    
    // Get unique categories
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    return categories;
  },

  /**
   * Search dental codes by description
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching dental codes
   */
  async search(query) {
    if (!query) return this.getAll();
    
    const { data, error } = await supabase
      .from('dental_codes')
      .select('*')
      .or(`code.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('category', { ascending: true })
      .order('code', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new dental code (admin only)
   * @param {Object} codeData - Dental code data
   * @param {string} codeData.code - The dental code (primary key)
   * @param {string} codeData.description - Description
   * @param {string} [codeData.category] - Category
   * @param {number} [codeData.default_price] - Default price
   * @returns {Promise<Object>} Created dental code
   */
  async create(codeData) {
    if (!codeData.code) throw new Error('code is required');
    if (!codeData.description) throw new Error('description is required');
    
    const { data, error } = await supabase
      .from('dental_codes')
      .insert({
        code: codeData.code,
        description: codeData.description,
        category: codeData.category || null,
        default_price: codeData.default_price || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a dental code (admin only)
   * @param {string} code - The dental code to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated dental code
   */
  async update(code, updateData) {
    if (!code) throw new Error('code is required');
    
    const { data, error } = await supabase
      .from('dental_codes')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a dental code (admin only)
   * @param {string} code - The dental code to delete
   */
  async delete(code) {
    if (!code) throw new Error('code is required');
    
    const { error } = await supabase
      .from('dental_codes')
      .delete()
      .eq('code', code);
    
    if (error) throw error;
  },

  /**
   * Group dental codes by category
   * @returns {Promise<Object>} Dental codes grouped by category
   */
  async getGroupedByCategory() {
    const codes = await this.getAll();
    
    return codes.reduce((grouped, code) => {
      const category = code.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(code);
      return grouped;
    }, {});
  },
};

export default dentalCodesService;
