import type { UserMeta } from '../types'
import { EMPTY_USER_META } from './template'

const STORAGE_KEY = 'typo-report-writer:user-meta:v1'

export function loadUserMeta(): UserMeta {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return EMPTY_USER_META

    const parsed = JSON.parse(stored) as Partial<UserMeta>
    return {
      reporterName: stringValue(parsed.reporterName),
      workTitle: stringValue(parsed.workTitle),
      genre: stringValue(parsed.genre),
      publisher: stringValue(parsed.publisher),
      authorName: stringValue(parsed.authorName),
    }
  } catch {
    return EMPTY_USER_META
  }
}

export function saveUserMeta(meta: UserMeta): void {
  if (Object.values(meta).every((value) => value === '')) {
    clearUserMeta()
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
}

export function clearUserMeta(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
