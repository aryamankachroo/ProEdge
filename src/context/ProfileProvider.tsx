import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { defaultProfile, type UserProfile } from '../types/profile'
import { ProfileContext } from './profile-context'

const PROFILE_KEY = 'proedge-profile-v1'

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { ...defaultProfile }
    return { ...defaultProfile, ...JSON.parse(raw) }
  } catch {
    return { ...defaultProfile }
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(loadProfile)

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {
      /* ignore */
    }
  }, [profile])

  const setProfile = useCallback((p: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...p }))
  }, [])

  const value = useMemo(
    () => ({ profile, setProfile }),
    [profile, setProfile],
  )

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}
