import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getSession,
  loginAccount,
  logoutAccount,
  registerAccount,
  type AuthUser,
} from '../lib/auth'

type AuthContextValue = {
  ready: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<string | null>
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getSession())
    setReady(true)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAccount({ email, password })
    if ('error' in result) return result.error
    setUser(result.user)
    return null
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const result = await registerAccount({ email, password, displayName })
      if ('error' in result) return result.error
      setUser(result.user)
      return null
    },
    [],
  )

  const logout = useCallback(() => {
    logoutAccount()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ ready, user, login, register, logout }),
    [ready, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
