import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReportMeta, ReportRow } from '../types'
import { ReportTable } from './ReportTable'

function Harness() {
  const [rows, setRows] = useState<ReportRow[]>([
    {
      id: 'first',
      location: '',
      original: '',
      correction: '',
      correctionType: 'none',
    },
  ])
  const [meta, setMeta] = useState<ReportMeta>({
    platform: '',
    locationUnit: 'episode',
    dateMode: 'calendar',
    startDate: '',
    endDate: '',
    directDate: '',
  })
  return (
    <ReportTable
      workTitle="푸른 밤"
      reportMeta={meta}
      onReportMetaChange={setMeta}
      rows={rows}
      onRowsChange={setRows}
    />
  )
}

describe('오탈자 표', () => {
  beforeEach(() => {
    document.execCommand = vi.fn(() => true)
  })

  it('첫 행이 존재하고 회색 추가 행을 선택하면 다음 행을 활성화한다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole('textbox', { name: '1행 본문' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '새 오탈자 행 추가' }))

    expect(screen.getByRole('textbox', { name: '2행 본문' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '3행 본문' })).not.toBeInTheDocument()
  })

  it('셀에 붙여넣을 때 일반 텍스트만 삽입한다', () => {
    render(<Harness />)
    const cell = screen.getByRole('textbox', { name: '1행 본문' })

    fireEvent.paste(cell, {
      clipboardData: {
        getData: (type: string) => (type === 'text/plain' ? '글자만' : '<b>글자만</b>'),
      },
    })

    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '글자만')
  })

  it('헤더의 권 단위를 모든 위치 입력에 적용하고 수정 유형을 선택한다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('radio', { name: '권' }))
    await user.type(screen.getByRole('textbox', { name: '1행 화 또는 권 숫자' }), '11')
    await user.click(screen.getByRole('radio', { name: '띄어쓰기' }))

    const locationHeader = screen.getByRole('columnheader', { name: /권/ })
    expect(locationHeader.querySelector(':scope > span')).toHaveTextContent('권')
    expect(screen.getByText('권', { selector: '.location-number span' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '띄어쓰기' })).toBeChecked()
  })

  it('달력 날짜를 YYYY/MM/DD 형식으로 입력한다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const startDate = screen.getByRole('textbox', { name: '열람 시작일' })
    await user.type(startDate, '20260905')

    expect(startDate).toHaveValue('2026/09/05')
  })

  it('플랫폼 선택 목록을 입력창에 연결해 표시한다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const platform = screen.getByRole('combobox', { name: '열람 플랫폼' })
    await user.click(platform)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: '리디' }))

    expect(platform).toHaveValue('리디')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
