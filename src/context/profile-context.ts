import { createContext } from 'react'
import type { UserProfile } from '../types/profile'

export type ProfileUpdate =
  | Partial<UserProfile>
  | ((prev: UserProfile) => Partial<UserProfile>)

export type ProfileContextValue = {
  profile: UserProfile
  setProfile: (p: ProfileUpdate) => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
