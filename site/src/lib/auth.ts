export type AuthUser = {
  id: string
  email: string
  displayName: string
  createdAt: string
}

type StoredUser = AuthUser & {
  passwordHash: string
  salt: string
}

type Session = {
  userId: string
  email: string
  displayName: string
}

const USERS_KEY = 'stress-monitor-users-v1'
const SESSION_KEY = 'stress-monitor-session-v1'

/** Shared demo login for judges / quick try — not secret, browser-local only. */
export const DEMO_ACCOUNT = {
  email: 'demo@innerweather.app',
  password: 'demo12345',
  displayName: 'Demo',
  id: 'u-demo-inner-weather',
} as const

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function displayFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'you'
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    const user = readUsers().find((u) => u.id === session.userId)
    if (!user) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    }
  } catch {
    return null
  }
}

function persistSession(user: AuthUser) {
  const session: Session = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function registerAccount(input: {
  email: string
  password: string
  displayName?: string
}): Promise<{ user: AuthUser } | { error: string }> {
  const email = normalizeEmail(input.email)
  const password = input.password

  if (!email.includes('@') || email.length < 5) {
    return { error: 'Enter a valid email address.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const users = readUsers()
  if (users.some((u) => u.email === email)) {
    return { error: 'An account with this email already exists.' }
  }

  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const user: StoredUser = {
    id: `u-${crypto.randomUUID()}`,
    email,
    displayName: input.displayName?.trim() || displayFromEmail(email),
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  }
  writeUsers([...users, user])

  const publicUser: AuthUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  }
  persistSession(publicUser)
  return { user: publicUser }
}

export async function loginAccount(input: {
  email: string
  password: string
}): Promise<{ user: AuthUser } | { error: string }> {
  const email = normalizeEmail(input.email)
  const user = readUsers().find((u) => u.email === email)
  if (!user) {
    return { error: 'No account found for that email.' }
  }

  const passwordHash = await hashPassword(input.password, user.salt)
  if (passwordHash !== user.passwordHash) {
    return { error: 'Incorrect password.' }
  }

  const publicUser: AuthUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  }
  persistSession(publicUser)
  return { user: publicUser }
}

export function logoutAccount() {
  localStorage.removeItem(SESSION_KEY)
}

export async function ensureDemoAccount(): Promise<void> {
  const email = normalizeEmail(DEMO_ACCOUNT.email)
  const users = readUsers()
  if (users.some((u) => u.email === email)) return

  const salt = 'demo-salt-v1'
  const passwordHash = await hashPassword(DEMO_ACCOUNT.password, salt)
  const user: StoredUser = {
    id: DEMO_ACCOUNT.id,
    email,
    displayName: DEMO_ACCOUNT.displayName,
    createdAt: '2020-01-01T00:00:00.000Z',
    salt,
    passwordHash,
  }
  writeUsers([...users, user])
}

export async function loginDemoAccount(): Promise<{ user: AuthUser } | { error: string }> {
  await ensureDemoAccount()
  return loginAccount({
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
  })
}
