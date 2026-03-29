import type { Profile } from '@/lib/types'

export const isAdmin = (profile: Profile | null): boolean => {
  return profile?.role === 'admin'
}

export const canManage = (profile: Profile | null): boolean => {
  return profile?.role === 'admin'
}
