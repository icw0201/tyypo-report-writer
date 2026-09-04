import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import type { EditableColumn, ReportMeta, ReportRow } from '../types'
import { FormattingToolbar, RichTextEditor } from './RichTextEditor'

interface ReportTableProps {
  workTitle: string
  reportMeta: ReportMeta
  onReportMetaChange: (meta: ReportMeta) => void
  rows: ReportRow[]
  onRowsChange: (rows: ReportRow[]) => void
}

const PLATFORMS = ['카카오페이지', '리디', '시리즈', '문피아']

export function ReportTable({
  workTitle,
  reportMeta,
  onReportMetaChange,
  rows,
  onRowsChange,
}: ReportTableProps) {
  const activeEditor = useRef<HTMLDivElement | null>(null)
  const activatingGhost = useRef(false)

  const updateMeta = <K extends keyof ReportMeta>(key: K, value: ReportMeta[K]) => {
    onReportMetaChange({ ...reportMeta, [key]: value })
  }

  const updateCell = (id: string, column: EditableColumn, value: string) => {
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, [column]: value } : row)))
  }

  const addRow = () => {
    if (activatingGhost.current) return
    activatingGhost.current = true
    const id = createRowId()
    onRowsChange([...rows, { id, location: '', original: '', correction: '' }])
    requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLDivElement>(
        `[data-cell="${id}-location"] [contenteditable="true"]`,
      )
      editor?.focus()
      activatingGhost.current = false
    })
  }

  const removeRow = (id: string) => {
    onRowsChange(rows.filter((row) => row.id !== id))
  }

  return (
    <section className="card report-section" aria-labelledby="report-table-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">REPORT TABLE</p>
          <h2 id="report-table-heading">오탈자 목록</h2>
        </div>
        <FormattingToolbar getEditor={() => activeEditor.current} compact />
      </div>

      <div className="report-meta-grid">
        <label className="field field--wide">
          <span>작품명</span>
          <input value={workTitle} placeholder="위 사용자 입력란에서 입력" readOnly />
        </label>
        <label className="field field--wide">
          <span>열람 플랫폼</span>
          <input
            list="platform-options"
            value={reportMeta.platform}
            placeholder="선택하거나 직접 입력"
            onChange={(event) => updateMeta('platform', event.target.value)}
          />
          <datalist id="platform-options">
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform} />
            ))}
          </datalist>
        </label>

        <div className="field field--date">
          <span>열람 일자</span>
          <div className="segmented" aria-label="날짜 입력 방식">
            <button
              type="button"
              className={reportMeta.dateMode === 'calendar' ? 'is-active' : ''}
              onClick={() => updateMeta('dateMode', 'calendar')}
            >
              <CalendarDays size={15} />
              달력
            </button>
            <button
              type="button"
              className={reportMeta.dateMode === 'direct' ? 'is-active' : ''}
              onClick={() => updateMeta('dateMode', 'direct')}
            >
              직접 입력
            </button>
          </div>
          {reportMeta.dateMode === 'calendar' ? (
            <div className="date-range">
              <input
                type="date"
                aria-label="열람 시작일"
                value={reportMeta.startDate}
                onChange={(event) => updateMeta('startDate', event.target.value)}
              />
              <span>~</span>
              <input
                type="date"
                aria-label="열람 종료일"
                min={reportMeta.startDate || undefined}
                value={reportMeta.endDate}
                onChange={(event) => updateMeta('endDate', event.target.value)}
              />
            </div>
          ) : (
            <input
              value={reportMeta.directDate}
              placeholder="예: 2026. 9. 1. ~ 2026. 9. 5."
              aria-label="열람 일자 직접 입력"
              onChange={(event) => updateMeta('directDate', event.target.value)}
            />
          )}
        </div>
      </div>

      <p className="table-help">
        붙여넣기는 글자만 적용됩니다. Enter로 줄을 바꾸고, Tab으로 다음 칸으로 이동하세요.
        Ctrl+B는 선택한 글자에 하늘색 형광펜을 적용합니다.
      </p>

      <div className="table-scroll">
        <div className="report-table" role="table" aria-label="오탈자 제보 표">
          <div className="report-row report-row--header" role="row">
            <div role="columnheader">num</div>
            <div role="columnheader">화/권(선택)</div>
            <div role="columnheader">본문</div>
            <div role="columnheader">수정</div>
            <div aria-hidden="true" />
          </div>

          {rows.map((row, index) => (
            <div className="report-row" role="row" key={row.id}>
              <div className="number-cell" role="cell">
                {index + 1}
              </div>
              <TableCell
                row={row}
                column="location"
                label={`${index + 1}행 화 또는 권`}
                placeholder="예: 12화"
                onChange={updateCell}
                onFocus={(editor) => {
                  activeEditor.current = editor
                }}
              />
              <TableCell
                row={row}
                column="original"
                label={`${index + 1}행 본문`}
                placeholder="오탈자가 있는 본문"
                onChange={updateCell}
                onFocus={(editor) => {
                  activeEditor.current = editor
                }}
              />
              <TableCell
                row={row}
                column="correction"
                label={`${index + 1}행 수정`}
                placeholder="수정할 내용"
                onChange={updateCell}
                onFocus={(editor) => {
                  activeEditor.current = editor
                }}
              />
              <button
                type="button"
                className="delete-row"
                aria-label={`${index + 1}행 삭제`}
                onClick={() => removeRow(row.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div
            className="report-row report-row--ghost"
            role="button"
            tabIndex={0}
            aria-label="새 오탈자 행 추가"
            onFocus={addRow}
            onClick={addRow}
          >
            <div>
              <Plus size={16} />
            </div>
            <div>클릭하거나 Tab으로 새 행 추가</div>
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>
    </section>
  )
}

interface TableCellProps {
  row: ReportRow
  column: EditableColumn
  label: string
  placeholder: string
  onChange: (id: string, column: EditableColumn, value: string) => void
  onFocus: (editor: HTMLDivElement) => void
}

function TableCell({
  row,
  column,
  label,
  placeholder,
  onChange,
  onFocus,
}: TableCellProps) {
  return (
    <div role="cell" data-cell={`${row.id}-${column}`}>
      <RichTextEditor
        value={row[column]}
        label={label}
        placeholder={placeholder}
        onChange={(value) => onChange(row.id, column, value)}
        onEditorFocus={onFocus}
      />
    </div>
  )
}

function createRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random()}`
}
