import { CalendarDays, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { extractHighlightedText, richHtmlToPlainText } from '../lib/clipboard'
import { escapeHtml } from '../lib/template'
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
  const [suggestion, setSuggestion] = useState<{
    rowId: string
    anchor: HTMLElement
  } | null>(null)

  const updateMeta = <K extends keyof ReportMeta>(key: K, value: ReportMeta[K]) => {
    onReportMetaChange({ ...reportMeta, [key]: value })
  }

  const updateCell = (id: string, column: EditableColumn, value: string) => {
    onRowsChange(
      rows.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, [column]: value }
        if (
          column === 'original' &&
          richHtmlToPlainText(row.correction).trim().length === 0
        ) {
          const highlighted = extractHighlightedText(value)
          if (highlighted) {
            next.correction = highlighted
              .split('\n')
              .map((text) => `${escapeHtml(text)} → `)
              .join('<br>')
          }
        }
        return next
      }),
    )
  }

  const insertSuggestion = (row: ReportRow, suggestion: string) => {
    const prefix = escapeHtml(suggestion)
    const hasCorrection = richHtmlToPlainText(row.correction).trim().length > 0
    updateCell(
      row.id,
      'correction',
      hasCorrection ? `${prefix}<br>${row.correction}` : prefix,
    )
    setSuggestion(null)
  }

  const updateRow = (
    id: string,
    update: Pick<ReportRow, 'location'> | Pick<ReportRow, 'correctionType'>,
  ) => {
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, ...update } : row)))
  }

  const addRow = () => {
    if (activatingGhost.current) return
    activatingGhost.current = true
    const id = createRowId()
    onRowsChange([
      ...rows,
      { id, location: '', original: '', correction: '', correctionType: 'none' },
    ])
    requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLInputElement>(
        `[data-cell="${id}-location"] .location-input`,
      )
      editor?.focus()
      activatingGhost.current = false
    })
  }

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      onRowsChange([
        { id, location: '', original: '', correction: '', correctionType: 'none' },
      ])
      return
    }
    onRowsChange(rows.filter((row) => row.id !== id))
  }

  return (
    <section
      className="card report-section"
      aria-labelledby="report-table-heading"
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement
        if (
          !target.closest('.suggestion-popover') &&
          !target.closest('.correction-types')
        ) {
          setSuggestion(null)
        }
      }}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">REPORT TABLE</p>
          <h2 id="report-table-heading">오탈자 목록</h2>
        </div>
      </div>

      <p className="table-help">
        붙여넣기는 글자만 적용됩니다. Enter로 줄을 바꾸고, Tab으로 다음 칸으로 이동하세요.
        Ctrl+B는 선택한 글자에 <mark>하늘색 형광펜</mark>을 적용합니다. `&gt;&gt;`를
        입력하면 → 기호로 자동 변환됩니다.
      </p>

      <div className="table-scroll">
        <div className="report-table" role="table" aria-label="오탈자 제보 표">
          <div className="report-info-row" role="row">
            <div className="report-info-label" role="rowheader">작품명</div>
            <div role="cell">
              <input
                value={workTitle ? `『${workTitle}』` : ''}
                aria-label="표 작품명"
                readOnly
              />
            </div>
          </div>
          <div className="report-info-row" role="row">
            <div className="report-info-label" role="rowheader">열람 플랫폼</div>
            <div role="cell">
              <PlatformCombobox
                value={reportMeta.platform}
                onChange={(value) => updateMeta('platform', value)}
              />
            </div>
          </div>
          <div className="report-info-row" role="row">
            <div className="report-info-label" role="rowheader">열람 일자</div>
            <div className="report-date-cell" role="cell">
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
                  <DateInput
                    label="열람 시작일"
                    value={reportMeta.startDate}
                    onChange={(value) => updateMeta('startDate', value)}
                  />
                  <span>~</span>
                  <DateInput
                    label="열람 종료일"
                    value={reportMeta.endDate}
                    min={reportMeta.startDate}
                    onChange={(value) => updateMeta('endDate', value)}
                  />
                </div>
              ) : (
                <input
                  value={reportMeta.directDate}
                  aria-label="열람 일자 직접 입력"
                  onChange={(event) => updateMeta('directDate', event.target.value)}
                />
              )}
            </div>
          </div>
          <div className="report-tools-row">
            <span>글자 서식</span>
            <FormattingToolbar getEditor={() => activeEditor.current} compact />
          </div>
          <div className="report-row report-row--header" role="row">
            <div role="columnheader">num</div>
            <div className="location-header" role="columnheader">
              <span>
                {reportMeta.locationUnit === 'episode'
                  ? '화'
                  : reportMeta.locationUnit === 'volume'
                    ? '권'
                    : '화/권'}
              </span>
              <div className="header-unit-toggle" aria-label="화 또는 권 단위">
                <label>
                  <input
                    type="radio"
                    name="location-unit"
                    checked={reportMeta.locationUnit === 'episode'}
                    onChange={() => updateMeta('locationUnit', 'episode')}
                  />
                  화
                </label>
                <label>
                  <input
                    type="radio"
                    name="location-unit"
                    checked={reportMeta.locationUnit === 'volume'}
                    onChange={() => updateMeta('locationUnit', 'volume')}
                  />
                  권
                </label>
              </div>
            </div>
            <div role="columnheader">본문</div>
            <div role="columnheader">수정</div>
            <div aria-hidden="true" />
          </div>

          {rows.map((row, index) => (
            <div
              className={`report-row report-row--data ${index % 2 === 1 ? 'is-alt' : ''}`}
              role="row"
              key={row.id}
            >
              <div className="number-cell" role="cell">
                {index + 1}
              </div>
              <div className="location-cell" role="cell" data-cell={`${row.id}-location`}>
                <div className="location-number">
                  <input
                    className="location-input"
                    inputMode="numeric"
                    aria-label={`${index + 1}행 화 또는 권 숫자`}
                    value={row.location}
                    onChange={(event) =>
                      updateRow(row.id, {
                        location: event.target.value.replace(/\D/g, ''),
                      })
                    }
                    onFocus={() => setSuggestion(null)}
                  />
                  {reportMeta.locationUnit && (
                    <span>{reportMeta.locationUnit === 'episode' ? '화' : '권'}</span>
                  )}
                </div>
              </div>
              <TableCell
                row={row}
                column="original"
                label={`${index + 1}행 본문`}
                onChange={updateCell}
                onFocus={(editor) => {
                  activeEditor.current = editor
                  setSuggestion(null)
                }}
              />
              <div className="correction-cell" role="cell" data-cell={`${row.id}-correction`}>
                <CorrectionTypePicker
                  row={row}
                  rowNumber={index + 1}
                  onChange={(correctionType, anchor) => {
                    updateRow(row.id, { correctionType })
                    setSuggestion(
                      ['spacing', 'symbol', 'polite'].includes(correctionType)
                        ? { rowId: row.id, anchor }
                        : null,
                    )
                  }}
                />
                {suggestion?.rowId === row.id && (
                  <SuggestionPopover
                    type={row.correctionType}
                    anchor={suggestion.anchor}
                    onChoose={(suggestion) => insertSuggestion(row, suggestion)}
                    onClose={() => setSuggestion(null)}
                  />
                )}
                <RichTextEditor
                  value={row.correction}
                  label={`${index + 1}행 수정`}
                  onChange={(value) => updateCell(row.id, 'correction', value)}
                  onEditorFocus={(editor) => {
                    activeEditor.current = editor
                    setSuggestion(null)
                  }}
                />
              </div>
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
  onChange: (id: string, column: EditableColumn, value: string) => void
  onFocus: (editor: HTMLDivElement) => void
}

function TableCell({
  row,
  column,
  label,
  onChange,
  onFocus,
}: TableCellProps) {
  return (
    <div role="cell" data-cell={`${row.id}-${column}`}>
      <RichTextEditor
        value={row[column]}
        label={label}
        onChange={(value) => onChange(row.id, column, value)}
        onEditorFocus={onFocus}
      />
    </div>
  )
}

const CORRECTION_TYPES: Array<{
  value: ReportRow['correctionType']
  label: string
}> = [
  { value: 'none', label: '없음' },
  { value: 'spacing', label: '띄어쓰기' },
  { value: 'symbol', label: '기호' },
  { value: 'properNoun', label: '고유명사' },
  { value: 'format', label: '서식' },
  { value: 'polite', label: '공손한 말' },
]

const SUGGESTIONS: Partial<
  Record<ReportRow['correctionType'], string[][]>
> = {
  spacing: [
    ['띄어쓰기가 두 개 있습니다.', '기호 사이 띄어쓰기가 없습니다.'],
  ],
  symbol: [
    ['문장 끝 마침표가 없습니다.'],
    ['대사 시작 말따옴표가 없습니다.', '대사 끝 말따옴표가 없습니다.'],
    [
      '작은 따옴표가 아닌 큰 따옴표가 되어야 할 것 같습니다.',
      '큰 따옴표가 아닌 작은 따옴표가 되어야 할 것 같습니다.',
    ],
    ['따옴표 기호의 방향이 반대로 사용되었습니다.'],
  ],
  polite: [
    [
      "본문 중 ''라고 표기된 부분이 혹시 맥락상 ''를 의미하신 건 아닐까 조심스럽게 추측해보았습니다. 제가 관련 분야에 전문적인 지식이 있는 것은 아니라 확신할 수는 없지만, 혹시나 해서 살짝 적었습니다.",
    ],
  ],
}

function SuggestionPopover({
  type,
  anchor,
  onChoose,
  onClose,
}: {
  type: ReportRow['correctionType']
  anchor: HTMLElement
  onChoose: (suggestion: string) => void
  onClose: () => void
}) {
  const groups = SUGGESTIONS[type]
  if (!groups) return null
  const anchorRect = anchor.getBoundingClientRect()
  const viewportWidth = window.innerWidth || 1024
  const width = Math.min(350, Math.max(240, viewportWidth - 16))
  const left = Math.max(
    window.scrollX + 8,
    Math.min(
      anchorRect.right + window.scrollX - width,
      window.scrollX + viewportWidth - width - 8,
    ),
  )
  const top = anchorRect.top + window.scrollY - 8

  return createPortal(
    <aside
      className="suggestion-popover"
      aria-label="자주 쓰는 수정 설명"
      style={{ left, top, width }}
    >
      <div className="suggestion-heading">
        <strong>자주 쓰는 설명</strong>
        <button type="button" aria-label="추천 닫기" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      {groups.map((group, groupIndex) => (
        <div className="suggestion-group" key={groupIndex}>
          {group.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => onChoose(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ))}
    </aside>,
    document.body,
  )
}

function PlatformCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const filteredPlatforms = PLATFORMS.filter((platform) =>
    platform.toLowerCase().includes(value.toLowerCase()),
  )
  const options = filteredPlatforms.length > 0 ? filteredPlatforms : PLATFORMS

  return (
    <div className="platform-combobox">
      <input
        role="combobox"
        aria-label="열람 플랫폼"
        aria-expanded={open}
        aria-controls="platform-listbox"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 100)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
      />
      <button
        type="button"
        aria-label="열람 플랫폼 목록 열기"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronDown size={16} />
      </button>
      {open && (
        <div id="platform-listbox" className="platform-options" role="listbox">
          {options.map((platform) => (
            <button
              type="button"
              role="option"
              aria-selected={value === platform}
              key={platform}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(platform)
                setOpen(false)
              }}
            >
              {platform}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CorrectionTypePicker({
  row,
  rowNumber,
  onChange,
}: {
  row: ReportRow
  rowNumber: number
  onChange: (type: ReportRow['correctionType'], anchor: HTMLElement) => void
}) {
  return (
    <div className="correction-types" aria-label={`${rowNumber}행 수정 유형`}>
      {CORRECTION_TYPES.map((type) => (
        <label key={type.value}>
          <input
            type="radio"
            name={`correction-type-${row.id}`}
            checked={row.correctionType === type.value}
            onChange={(event) => {
              const anchor = event.currentTarget.closest<HTMLElement>('.correction-types')
              if (anchor) onChange(type.value, anchor)
            }}
          />
          {type.label}
        </label>
      ))}
    </div>
  )
}

function DateInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: string
  min?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="slash-date-input">
      <input
        value={value}
        inputMode="numeric"
        maxLength={10}
        aria-label={label}
        onChange={(event) => onChange(formatDateTyping(event.target.value))}
      />
      <CalendarDays size={15} aria-hidden="true" />
      <input
        className="native-date-picker"
        type="date"
        aria-label={`${label} 달력`}
        value={toIsoDate(value)}
        min={min ? toIsoDate(min) : undefined}
        onChange={(event) => onChange(event.target.value.replaceAll('-', '/'))}
      />
    </div>
  )
}

function formatDateTyping(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`
}

function toIsoDate(value: string): string {
  return /^\d{4}\/\d{2}\/\d{2}$/.test(value) ? value.replaceAll('/', '-') : ''
}

function createRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random()}`
}
