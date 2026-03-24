import { supabase } from '@/lib/supabaseClient'

export interface Clinic {
  id: string
  name: string
  description?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  website?: string
  owner_id?: string
  subscription_plan?: 'free' | 'starter' | 'pro' | 'enterprise'
  subscription_status?: 'active' | 'cancelled' | 'expired'
  max_users?: number
  max_patients?: number
  created_at: string
  updated_at: string
}

/**
 * Clinic Service - Manage clinics in the system
 */
export const clinicsService = {
  /**
   * Get current user's clinic
   */
  async getCurrentClinic() {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      throw new Error('User not authenticated')
    }

    // Get user's profile to find their clinic
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', session.session.user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Could not find user profile')
    }

    // Get clinic details
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', profile.clinic_id)
      .single()

    if (clinicError) throw clinicError
    return clinic as Clinic
  },

  /**
   * Get clinic by ID
   */
  async getClinic(clinicId: string) {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single()

    if (error) throw error
    return data as Clinic
  },

  /**
   * Create a new clinic
   */
  async createClinic(data: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>) {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return clinic as Clinic
  },

  /**
   * Update clinic details
   */
  async updateClinic(clinicId: string, updates: Partial<Clinic>) {
    const { data, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single()

    if (error) throw error
    return data as Clinic
  },

  /**
   * Update clinic subscription
   */
  async updateSubscription(
    clinicId: string,
    plan: 'free' | 'starter' | 'pro' | 'enterprise',
    status: 'active' | 'cancelled' | 'expired'
  ) {
    return this.updateClinic(clinicId, {
      subscription_plan: plan,
      subscription_status: status,
    })
  },

  /**
   * Get clinic statistics
   */
  async getClinicStats(clinicId: string) {
    const [patientsRes, appointmentsRes, usersRes, invoicesRes] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('invoices').select('total', { head: false }).eq('clinic_id', clinicId),
    ])

    const totalRevenue = invoicesRes.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

    return {
      patients: patientsRes.count || 0,
      appointments: appointmentsRes.count || 0,
      users: usersRes.count || 0,
      revenue: totalRevenue,
    }
  },

  /**
   * Get clinic team members
   */
  async getTeamMembers(clinicId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Add team member to clinic
   */
  async addTeamMember(clinicId: string, email: string, role: 'admin' | 'assistant') {
    // Note: In production, this would involve inviting the user
    // For now, returns invitation details
    return {
      clinic_id: clinicId,
      email,
      role,
      invited_at: new Date().toISOString(),
    }
  },

  /**
   * Remove team member
   */
  async removeTeamMember(clinicId: string, userId: string) {
    // Delete user's profile from clinic
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('id', userId)

    if (error) throw error
    return true
  },

  /**
   * Delete clinic (admin only)
   */
  async deleteClinic(clinicId: string) {
    const { error } = await supabase
      .from('clinics')
      .delete()
      .eq('id', clinicId)

    if (error) throw error
    return true
  },

  /**
   * Get clinic activity log
   */
  async getActivityLog(clinicId: string, limit = 50) {
    const { data, error } = await supabase
      .from('clinic_activity_log')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Log clinic activity
   */
  async logActivity(clinicId: string, action: string, details?: any) {
    const { error } = await supabase
      .from('clinic_activity_log')
      .insert([
        {
          clinic_id: clinicId,
          action,
          details,
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
        },
      ])

    if (error) throw error
    return true
  },
}
