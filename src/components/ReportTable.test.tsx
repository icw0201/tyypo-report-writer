import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReportMeta, ReportRow } from '../types'
import { ReportTable } from './ReportTable'

function Harness() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [meta, setMeta] = useState<ReportMeta>({
    platform: '',
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

  it('회색 추가 행을 선택하면 한 행을 활성화한다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: '새 오탈자 행 추가' }))

    expect(screen.getByRole('textbox', { name: '1행 본문' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '2행 본문' })).not.toBeInTheDocument()
  })

  it('셀에 붙여넣을 때 일반 텍스트만 삽입한다', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: '새 오탈자 행 추가' }))
    const cell = screen.getByRole('textbox', { name: '1행 본문' })

    fireEvent.paste(cell, {
      clipboardData: {
        getData: (type: string) => (type === 'text/plain' ? '글자만' : '<b>글자만</b>'),
      },
    })

    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '글자만')
  })
})
