import { beforeEach, describe, expect, it } from 'vitest'
import { clearUserMeta, loadUserMeta, saveUserMeta } from './storage'
import { EMPTY_USER_META } from './template'

describe('사용자 입력 로컬 저장', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('메타데이터를 저장하고 복원한다', () => {
    const meta = {
      reporterName: '독자',
      workTitle: '푸른 밤',
      genre: '판타지',
      publisher: '하늘출판사',
      authorName: '김작가',
    }
    saveUserMeta(meta)
    expect(loadUserMeta()).toEqual(meta)
  })

  it('초기화하거나 빈 값을 저장하면 저장소를 비운다', () => {
    saveUserMeta({ ...EMPTY_USER_META, reporterName: '독자' })
    clearUserMeta()
    expect(loadUserMeta()).toEqual(EMPTY_USER_META)

    saveUserMeta(EMPTY_USER_META)
    expect(localStorage.length).toBe(0)
  })
})
