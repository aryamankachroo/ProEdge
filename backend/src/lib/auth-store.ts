import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export interface AuthUserRecord {
  userId: string
  email: string
  passwordHash: string
}

interface AuthStoreFile {
  users: AuthUserRecord[]
}

const STORE_PATH = join(__dirname, '..', '..', 'data', 'auth-users.json')

function ensureStore(): AuthStoreFile {
  const dir = dirname(STORE_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  if (!existsSync(STORE_PATH)) {
    const empty: AuthStoreFile = { users: [] }
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
  try {
    const raw = readFileSync(STORE_PATH, 'utf-8')
    return JSON.parse(raw) as AuthStoreFile
  } catch {
    const empty: AuthStoreFile = { users: [] }
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
}

function saveStore(store: AuthStoreFile): void {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function findUserByEmail(email: string): AuthUserRecord | undefined {
  const n = normalizeEmail(email)
  const store = ensureStore()
  return store.users.find((u) => u.email === n)
}

export function findUserById(userId: string): AuthUserRecord | undefined {
  const store = ensureStore()
  return store.users.find((u) => u.userId === userId)
}

export async function createUser(email: string, password: string): Promise<AuthUserRecord> {
  const n = normalizeEmail(email)
  const store = ensureStore()
  if (store.users.some((u) => u.email === n)) {
    throw new Error('EMAIL_IN_USE')
  }
  const passwordHash = await bcrypt.hash(password, 12)
  const record: AuthUserRecord = {
    userId: randomUUID(),
    email: n,
    passwordHash,
  }
  store.users.push(record)
  saveStore(store)
  return record
}

export async function verifyPassword(record: AuthUserRecord, password: string): Promise<boolean> {
  return bcrypt.compare(password, record.passwordHash)
}
