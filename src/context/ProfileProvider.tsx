import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { defaultProfile, type UserProfile } from '../types/profile'
import { ProfileContext, type ProfileUpdate } from './profile-context'
import { fetchProfile } from '../lib/api'

const PROFILE_KEY = 'proedge-profile-v1'

function loadLocal(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { ...defaultProfile }
    return { ...defaultProfile, ...JSON.parse(raw) }
  } catch {
    return { ...defaultProfile }
  }
}

/** Merge backend profile fields into the local profile (local wins for UI-only fields). */
function mergeBackend(local: UserProfile, remote: Awaited<ReturnType<typeof fetchProfile>>): UserProfile {
  if (!remote) return local
  return {
    ...local,
    name: remote.name ?? local.name,
    studyStatus: (remote.studyStatus?.replaceAll('_', '-') as UserProfile['studyStatus']) || local.studyStatus,
    hoursPerDay: remote.hoursPerDay ?? local.hoursPerDay,
    fullTimeStudying: remote.studyLoad === 'full_time_focus',
    targetScore: remote.targetScore ?? local.targetScore,
    baselineScore: remote.baselineScore ?? local.baselineScore,
    examDate: remote.examDate ?? local.examDate,
    studyDays: (remote.studyDays as number[]) ?? local.studyDays,
    resources: (remote.resources as string[]) ?? local.resources,
    ankiDecks: (remote.ankiDecks as string[]) ?? local.ankiDecks,
    weakSections: (remote.weakSections as string[]) ?? local.weakSections,
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(loadLocal)
  const didHydrate = useRef(false)

  // On mount: try to hydrate from backend (non-blocking — local state renders immediately)
  useEffect(() => {
    if (didHydrate.current) return
    didHydrate.current = true

    fetchProfile()
      .then((remote) => {
        if (remote) {
          setProfileState((prev) => mergeBackend(prev, remote))
        }
      })
      .catch(() => {
        // Backend unavailable — continue with localStorage only (no crash)
      })
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {
      /* ignore */
    }
  }, [profile])

  const setProfile = useCallback((p: ProfileUpdate) => {
    setProfileState((prev) => ({
      ...prev,
      ...(typeof p === 'function' ? p(prev) : p),
    }))
  }, [])

  const value = useMemo(
    () => ({ profile, setProfile }),
    [profile, setProfile],
  )

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}
