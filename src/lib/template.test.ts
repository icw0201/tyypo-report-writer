import { describe, expect, it } from 'vitest'
import { createDefaultBody, createDefaultSubject } from './template'

const meta = {
  reporterName: '독자',
  workTitle: '푸른 밤',
  genre: '판타지',
  publisher: '하늘출판사',
  authorName: '김작가',
}

describe('메일 기본 문안', () => {
  it('사용자 입력값으로 제목을 만든다', () => {
    expect(createDefaultSubject(meta)).toBe(
      '[오탈자 제보] 하늘출판사 판타지 《푸른 밤》 오탈자 제보 드립니다',
    )
  })

  it('본문의 HTML 특수 문자를 안전하게 처리한다', () => {
    const body = createDefaultBody({ ...meta, workTitle: '<script>작품' })
    expect(body).toContain('《&lt;script&gt;작품》')
    expect(body).not.toContain('<script>')
    expect(body).toContain('독자 독자 드림')
  })

  it('선택 입력이 비어도 제목과 본문이 자연스럽다', () => {
    const optionalEmpty = {
      reporterName: '',
      workTitle: '푸른 밤',
      genre: '',
      publisher: '',
      authorName: '',
    }
    expect(createDefaultSubject(optionalEmpty)).toBe(
      '[오탈자 제보] 《푸른 밤》 오탈자 제보 드립니다',
    )
    expect(createDefaultBody(optionalEmpty)).toContain('연재 중인 《푸른 밤》')
    expect(createDefaultBody(optionalEmpty)).toContain('<br>독자 드림')
  })
})
