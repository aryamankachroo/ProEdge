import { createContext } from 'react'
import type { UserProfile } from '../types/profile'

export type ProfileContextValue = {
  profile: UserProfile
  setProfile: (p: Partial<UserProfile>) => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
