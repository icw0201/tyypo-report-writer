import { describe, expect, it } from 'vitest'
import {
  createBodyPayload,
  createTablePayload,
  formatReadingDate,
  sanitizeRichHtml,
} from './clipboard'

describe('클립보드 데이터', () => {
  it('위험한 태그와 붙여넣은 스타일을 제거한다', () => {
    const safe = sanitizeRichHtml(
      '<script>alert(1)</script><strong>오타</strong><span style="color:red">수정</span>',
    )
    expect(safe).toBe('<strong>오타</strong>수정')
  })

  it('본문에 HTML과 일반 텍스트를 함께 만든다', () => {
    const payload = createBodyPayload('<p>안녕<br><strong>하세요</strong></p>')
    expect(payload.plain).toBe('안녕\n하세요')
    expect(payload.html).toContain('<strong>하세요</strong>')
  })

  it('단일 날짜와 기간을 구분한다', () => {
    expect(
      formatReadingDate({
        platform: '',
        dateMode: 'calendar',
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        directDate: '',
      }),
    ).toBe('2026-09-01 ~ 2026-09-05')
  })

  it('Gmail용 표와 TSV 대체 텍스트를 만든다', () => {
    const payload = createTablePayload(
      '푸른 밤',
      {
        platform: '리디',
        dateMode: 'direct',
        startDate: '',
        endDate: '',
        directDate: '9월 1일',
      },
      [
        {
          id: '1',
          unit: 'episode',
          location: '12',
          original: '<strong>됬다</strong>',
          correction: '됐다',
        },
      ],
    )

    expect(payload.plain).toContain('작품명\t푸른 밤')
    expect(payload.plain).toContain('1\t12화\t됬다\t됐다')
    expect(payload.html).toContain('border-collapse:collapse')
    expect(payload.html).toContain('<strong>됬다</strong>')
    expect(payload.html).not.toContain('class=')
  })
})
