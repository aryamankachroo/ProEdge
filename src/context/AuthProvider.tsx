import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const TOKEN_KEY = 'proedge_auth_token'
const USER_KEY = 'proedge_auth_user'

/** Persisted checkbox default: keep signed in on this browser. */
const REMEMBER_PREF_KEY = 'proedge_auth_remember_pref'

function readRememberPreference(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_PREF_KEY)
    return v !== 'false'
  } catch {
    return true
  }
}

/** Default for “Keep me signed in” on login/signup forms. */
export function getStoredRememberPreference(): boolean {
  return readRememberPreference()
}

function saveRememberPreference(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_PREF_KEY, remember ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

export type AuthUser = { id: string; email: string }

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  /** False until initial session check against `/api/auth/me` finishes. */
  ready: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signup: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as AuthUser
    if (typeof u?.id === 'string' && typeof u?.email === 'string') return u
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  )
  const [user, setUser] = useState<AuthUser | null>(() =>
    typeof localStorage !== 'undefined' ? readStoredUser() : null,
  )
  const [ready, setReady] = useState(false)

  const persistSession = useCallback((t: string | null, u: AuthUser | null) => {
    setToken(t)
    setUser(u)
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t)
      else localStorage.removeItem(TOKEN_KEY)
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore quota */
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (!stored) {
        if (!cancelled) setReady(true)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${stored}` },
        })
        if (!res.ok) throw new Error('invalid session')
        const data = (await res.json()) as { user: AuthUser }
        if (!cancelled) persistSession(stored, data.user)
      } catch {
        try {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [persistSession])

  const login = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      saveRememberPreference(rememberMe)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        token?: string
        user?: AuthUser
      }
      if (!res.ok) {
        throw new Error(body.error ?? res.statusText)
      }
      if (!body.token || !body.user) {
        throw new Error('Invalid response from server')
      }
      persistSession(body.token, body.user)
    },
    [persistSession],
  )

  const signup = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      saveRememberPreference(rememberMe)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        token?: string
        user?: AuthUser
      }
      if (!res.ok) {
        throw new Error(body.error ?? res.statusText)
      }
      if (!body.token || !body.user) {
        throw new Error('Invalid response from server')
      }
      persistSession(body.token, body.user)
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    persistSession(null, null)
  }, [persistSession])

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      signup,
      logout,
    }),
    [user, token, ready, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
