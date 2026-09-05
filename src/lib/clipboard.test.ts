import { describe, expect, it } from 'vitest'
import {
  createBodyPayload,
  createTablePayload,
  extractHighlightedText,
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
        locationUnit: 'episode',
        dateMode: 'calendar',
        startDate: '2026/09/01',
        endDate: '2026/09/05',
        directDate: '',
      }),
    ).toBe('2026/09/01 ~ 2026/09/05')
  })

  it('Gmail용 표와 TSV 대체 텍스트를 만든다', () => {
    const payload = createTablePayload(
      '푸른 밤',
      {
        platform: '리디',
        locationUnit: 'episode',
        dateMode: 'direct',
        startDate: '',
        endDate: '',
        directDate: '9월 1일',
      },
      [
        {
          id: '1',
          location: '12',
          original: '<strong>됬다</strong>',
          correction: '됐다',
          correctionType: 'spacing',
        },
      ],
      'https://example.vercel.app',
    )

    expect(payload.plain).toContain('작품명\t『푸른 밤』')
    expect(payload.plain).toContain('1\t12화\t됬다\t[띄어쓰기] 됐다')
    expect(payload.html).toContain('border-collapse:collapse')
    expect(payload.html).toContain('<strong>됬다</strong>')
    expect(payload.html).toContain(
      'href="https://example.vercel.app"',
    )
    expect(payload.plain).toContain(
      '이 표는 오타탈자 제보 작성기(tyypo-report-writer)를 사용해 작성되었습니다.',
    )
    expect(payload.html).not.toContain('class=')
  })

  it('형광펜이 적용된 글자만 추출한다', () => {
    expect(
      extractHighlightedText(
        '앞 <span style="background-color: rgb(220, 232, 255)">한국어</span> 뒤',
      ),
    ).toBe('한국어')
  })

  it('공손한 말은 추천 문구만 복사하고 유형명은 복사하지 않는다', () => {
    const payload = createTablePayload(
      '푸른 밤',
      {
        platform: '리디',
        locationUnit: 'episode',
        dateMode: 'direct',
        startDate: '',
        endDate: '',
        directDate: '2026/09/05',
      },
      [
        {
          id: '1',
          location: '3',
          original: '원문',
          correction: '조심스럽게 추측해보았습니다.',
          correctionType: 'polite',
        },
      ],
    )

    expect(payload.plain).toContain('조심스럽게 추측해보았습니다.')
    expect(payload.plain).not.toContain('[공손한 말]')
    expect(payload.html).not.toContain('[공손한 말]')
  })
})
