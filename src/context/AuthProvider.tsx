import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext, type AuthUser } from './auth-context'

const SESSION_KEY = 'proedge-auth-v1'
const USERS_KEY = 'proedge-users-v1'

type StoredUser = AuthUser & { password: string }

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.email || !parsed?.name) return null
    return { email: parsed.email, name: parsed.name }
  } catch {
    return null
  }
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function saveSession(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession())

  const login = useCallback(async (email: string, password: string) => {
    const normalized = normalizeEmail(email)
    if (!normalized || !password) {
      throw new Error('Email and password are required.')
    }

    const users = loadUsers()
    const match = users.find((u) => u.email === normalized)
    if (!match || match.password !== password) {
      throw new Error('Invalid email or password.')
    }

    const next: AuthUser = { email: match.email, name: match.name }
    saveSession(next)
    setUser(next)
    return next
  }, [])

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const trimmedName = name.trim()
      const normalized = normalizeEmail(email)
      if (!trimmedName) throw new Error('Name is required.')
      if (!normalized) throw new Error('Email is required.')
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      const users = loadUsers()
      if (users.some((u) => u.email === normalized)) {
        throw new Error('An account with this email already exists.')
      }

      const nextUser: StoredUser = {
        name: trimmedName,
        email: normalized,
        password,
      }
      saveUsers([...users, nextUser])

      const session: AuthUser = {
        email: nextUser.email,
        name: nextUser.name,
      }
      saveSession(session)
      setUser(session)
      return session
    },
    [],
  )

  const logout = useCallback(() => {
    saveSession(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [user, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
