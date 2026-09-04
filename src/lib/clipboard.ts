import type { ReportMeta, ReportRow } from '../types'
import { escapeHtml } from './template'

const HIGHLIGHT_COLOR = '#DCE8FF'

export interface ClipboardPayload {
  plain: string
  html?: string
}

export async function writeClipboard(payload: ClipboardPayload): Promise<void> {
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    const parts: Record<string, Blob> = {
      'text/plain': new Blob([payload.plain], { type: 'text/plain' }),
    }
    if (payload.html) {
      parts['text/html'] = new Blob([payload.html], { type: 'text/html' })
    }
    await navigator.clipboard.write([new ClipboardItem(parts)])
    return
  }

  const onCopy = (event: ClipboardEvent) => {
    event.preventDefault()
    event.clipboardData?.setData('text/plain', payload.plain)
    if (payload.html) event.clipboardData?.setData('text/html', payload.html)
  }

  document.addEventListener('copy', onCopy)
  const copied = document.execCommand('copy')
  document.removeEventListener('copy', onCopy)
  if (!copied) throw new Error('클립보드에 복사하지 못했습니다.')
}

export function createBodyPayload(html: string): ClipboardPayload {
  const safeHtml = sanitizeRichHtml(html)
  return {
    plain: richHtmlToPlainText(safeHtml),
    html: `<div style="font-family:Arial,'Malgun Gothic',sans-serif;font-size:14px;line-height:1.7;color:#1f2937">${safeHtml}</div>`,
  }
}

export function createTablePayload(
  workTitle: string,
  reportMeta: ReportMeta,
  rows: ReportRow[],
  projectUrl = '',
): ClipboardPayload {
  const attribution =
    '이 표는 오타탈자 제보 작성기(tyypo-report-writer)를 사용해 작성되었습니다.'
  const metadata = [
    ['작품명', workTitle],
    ['열람 플랫폼', reportMeta.platform],
    ['열람 일자', formatReadingDate(reportMeta)],
  ]

  const plainLines = [
    ...metadata.map(([label, value]) => `${label}\t${value}`),
    '',
    `num\t${locationHeader(reportMeta.locationUnit)}\t본문\t수정`,
    ...rows.map((row, index) =>
      [
        String(index + 1),
        formatLocation(row, reportMeta.locationUnit),
        richHtmlToPlainText(row.original),
        formatCorrectionPlain(row),
      ].join('\t'),
    ),
    '',
    attribution,
  ]

  const baseCell =
    "border:1px solid #94a3b8;padding:8px 10px;vertical-align:top;white-space:pre-wrap;font-family:Arial,'Malgun Gothic',sans-serif;font-size:14px;line-height:1.5;color:#1f2937"
  const labelCell = `${baseCell};background-color:#eef4ff;font-weight:700;width:120px`
  const headerCell = `${baseCell};background-color:#6196f7;color:#ffffff;font-weight:700;text-align:center`

  const metadataHtml = metadata
    .map(
      ([label, value]) =>
        `<tr><td style="${labelCell}">${escapeHtml(label)}</td><td colspan="3" style="${baseCell}">${escapeHtml(value || '-')}</td></tr>`,
    )
    .join('')
  const rowsHtml = rows
    .map(
      (row, index) =>
        `<tr><td style="${baseCell};text-align:center;width:54px">${index + 1}</td>` +
        `<td style="${baseCell};width:130px">${escapeHtml(formatLocation(row, reportMeta.locationUnit)) || '&nbsp;'}</td>` +
        `<td style="${baseCell};width:280px">${sanitizeRichHtml(row.original) || '&nbsp;'}</td>` +
        `<td style="${baseCell};width:280px">${formatCorrectionHtml(row) || '&nbsp;'}</td></tr>`,
    )
    .join('')
  const safeProjectUrl = /^https?:\/\//.test(projectUrl) ? escapeHtml(projectUrl) : ''
  const projectName = safeProjectUrl
    ? `<a href="${safeProjectUrl}" style="color:#3974d8;text-decoration:underline">tyypo-report-writer</a>`
    : 'tyypo-report-writer'
  const attributionHtml =
    `<tr><td colspan="4" style="${baseCell};color:#64748b;background-color:#f8fafc;font-size:12px;text-align:center">` +
    `이 표는 오타탈자 제보 작성기(${projectName})를 사용해 작성되었습니다.</td></tr>`

  return {
    plain: plainLines.join('\n'),
    html:
      `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px">` +
      `<tbody>${metadataHtml}` +
      `<tr><td style="${headerCell};width:54px">num</td><td style="${headerCell};width:130px">${locationHeader(reportMeta.locationUnit)}</td>` +
      `<td style="${headerCell};width:280px">본문</td><td style="${headerCell};width:280px">수정</td></tr>` +
      `${rowsHtml}${attributionHtml}</tbody></table>`,
  }
}

export function formatLocation(
  row: ReportRow,
  unit: ReportMeta['locationUnit'],
): string {
  const suffix = unit === 'episode' ? '화' : unit === 'volume' ? '권' : ''
  return `${row.location}${suffix}`
}

function locationHeader(unit: ReportMeta['locationUnit']): string {
  return unit === 'episode' ? '화' : unit === 'volume' ? '권' : '화/권(선택)'
}

function formatCorrectionPlain(row: ReportRow): string {
  const type = correctionTypeLabel(row.correctionType)
  const correction = richHtmlToPlainText(row.correction)
  return type ? `[${type}] ${correction}`.trim() : correction
}

function formatCorrectionHtml(row: ReportRow): string {
  const type = correctionTypeLabel(row.correctionType)
  const correction = sanitizeRichHtml(row.correction)
  if (!type) return correction
  return `<span style="color:#64748b;font-size:12px">[${type}]</span>${correction ? `<br>${correction}` : ''}`
}

function correctionTypeLabel(type: ReportRow['correctionType']): string {
  if (type === 'spacing') return '띄어쓰기'
  if (type === 'symbol') return '기호'
  if (type === 'properNoun') return '고유명사'
  return ''
}

export function formatReadingDate(meta: ReportMeta): string {
  if (meta.dateMode === 'direct') return meta.directDate.trim()
  if (!meta.startDate) return ''
  if (!meta.endDate || meta.startDate === meta.endDate) return meta.startDate
  return `${meta.startDate} ~ ${meta.endDate}`
}

export function sanitizeRichHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  return Array.from(root.childNodes).map(serializeSafeNode).join('')
}

export function richHtmlToPlainText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  return Array.from(root.childNodes)
    .map(nodeToPlainText)
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function serializeSafeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? '')
  if (!(node instanceof HTMLElement)) return ''

  const children = Array.from(node.childNodes).map(serializeSafeNode).join('')
  switch (node.tagName) {
    case 'SCRIPT':
    case 'STYLE':
      return ''
    case 'BR':
      return '<br>'
    case 'B':
    case 'STRONG':
      return `<strong>${children}</strong>`
    case 'I':
    case 'EM':
      return `<em>${children}</em>`
    case 'U':
      return `<u>${children}</u>`
    case 'MARK':
      return `<span style="background-color:${HIGHLIGHT_COLOR}">${children}</span>`
    case 'SPAN':
    case 'FONT': {
      const hasHighlight =
        node.style.backgroundColor.length > 0 ||
        node.getAttribute('color')?.toLowerCase() === HIGHLIGHT_COLOR.toLowerCase()
      return hasHighlight
        ? `<span style="background-color:${HIGHLIGHT_COLOR}">${children}</span>`
        : children
    }
    case 'P':
      return `<p style="margin:0 0 14px">${children || '<br>'}</p>`
    case 'DIV':
      return `<div>${children || '<br>'}</div>`
    default:
      return children
  }
}

function nodeToPlainText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (!(node instanceof HTMLElement)) return ''
  if (node.tagName === 'BR') return '\n'

  const text = Array.from(node.childNodes).map(nodeToPlainText).join('')
  return node.tagName === 'P' || node.tagName === 'DIV' ? `${text}\n` : text
}
