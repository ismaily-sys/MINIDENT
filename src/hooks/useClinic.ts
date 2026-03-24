import { useState, useCallback, useEffect } from 'react'
import { clinicsService, type Clinic } from '@/services/clinics.service'
import { useToast } from '@/context/ToastContext'

export const useClinic = () => {
  const { showToast } = useToast()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current clinic
  const fetchClinic = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await clinicsService.getCurrentClinic()
      setClinic(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch clinic'
      setError(message)
      showToast(message, 'error')
      return null
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Fetch clinic statistics
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

  // Fetch team members
  const fetchTeam = useCallback(async (clinicId: string) => {
    try {
      const data = await clinicsService.getTeamMembers(clinicId)
      setTeam(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team'
      showToast(message, 'error')
      return null
    }
  }, [showToast])

  // Update clinic
  const updateClinic = useCallback(
    async (clinicId: string, updates: Partial<Clinic>) => {
      try {
        setLoading(true)
        const updated = await clinicsService.updateClinic(clinicId, updates)
        setClinic(updated)
        showToast('Clinic updated successfully', 'success')
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update clinic'
        showToast(message, 'error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  // Create clinic
  const createClinic = useCallback(
    async (data: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        setLoading(true)
        const newClinic = await clinicsService.createClinic(data)
        setClinic(newClinic)
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

  // Add team member
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

  // Remove team member
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

  // Initialize
  useEffect(() => {
    fetchClinic()
  }, [fetchClinic])

  // Fetch stats and team when clinic is loaded
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
    fetchClinic,
    fetchStats,
    fetchTeam,
    createClinic,
    updateClinic,
    addTeamMember,
    removeTeamMember,
  }
}
