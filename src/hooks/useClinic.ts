import { useState, useCallback, useEffect } from 'react'
import { clinicsService, type Clinic } from '@/services/clinics.service'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import type { ClinicStats } from '@/lib/types'

export const useClinic = () => {
  const { showToast } = useToast()
  const { clinic: authClinic, updateClinic: authUpdateClinic } = useAuth()
  const clinic = authClinic as Clinic | null

  const [stats, setStats] = useState<ClinicStats | null>(null)
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (clinicId: string) => {
    try {
      const data = await clinicsService.getClinicStats(clinicId)
      setStats(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats'
      showToast(message, 'error')
      return null
    }
  }, [showToast])

  const fetchTeam = useCallback(async (clinicId: string) => {
    try {
      const data = await clinicsService.getTeamMembers(clinicId)
      setTeam(data ?? [])
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team'
      showToast(message, 'error')
      return null
    }
  }, [showToast])

  const updateClinic = useCallback(
    async (clinicId: string, updates: Partial<Clinic>) => {
      try {
        setLoading(true)
        const updated = await authUpdateClinic(updates)
        showToast('Clinic updated successfully', 'success')
        return updated as Clinic
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update clinic'
        showToast(message, 'error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [authUpdateClinic, showToast]
  )

  const createClinic = useCallback(
    async (data: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        setLoading(true)
        const newClinic = await clinicsService.createClinic(data)
        showToast('Clinic created successfully', 'success')
        return newClinic
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create clinic'
        showToast(message, 'error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  const addTeamMember = useCallback(
    async (clinicId: string, email: string, role: 'admin' | 'assistant') => {
      try {
        await clinicsService.addTeamMember(clinicId, email, role)
        showToast(`Invitation sent to ${email}`, 'success')
        await fetchTeam(clinicId)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add team member'
        showToast(message, 'error')
      }
    },
    [showToast, fetchTeam]
  )

  const removeTeamMember = useCallback(
    async (clinicId: string, userId: string) => {
      try {
        await clinicsService.removeTeamMember(clinicId, userId)
        showToast('Team member removed', 'success')
        await fetchTeam(clinicId)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove team member'
        showToast(message, 'error')
      }
    },
    [showToast, fetchTeam]
  )

  // Fetch team and stats once clinic is available from AuthContext
  useEffect(() => {
    if (clinic?.id) {
      fetchStats(clinic.id)
      fetchTeam(clinic.id)
    }
  }, [clinic?.id, fetchStats, fetchTeam])

  return {
    clinic,
    stats,
    team,
    loading,
    error,
    fetchStats,
    fetchTeam,
    createClinic,
    updateClinic,
    addTeamMember,
    removeTeamMember,
  }
}
