import {
  Check,
  Copy,
  FilePenLine,
  GitBranch,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ReportTable } from './components/ReportTable'
import { RichTextEditor } from './components/RichTextEditor'
import { createBodyPayload, createTablePayload, writeClipboard } from './lib/clipboard'
import { clearUserMeta, loadUserMeta, saveUserMeta } from './lib/storage'
import {
  createDefaultBody,
  createDefaultSubject,
  EMPTY_USER_META,
} from './lib/template'
import type { ReportMeta, ReportRow, UserMeta } from './types'

function App() {
  const [meta, setMeta] = useState<UserMeta>(() => loadUserMeta())
  const [subject, setSubject] = useState(() => createDefaultSubject(meta))
  const [bodyHtml, setBodyHtml] = useState(() => createDefaultBody(meta))
  const [subjectEdited, setSubjectEdited] = useState(false)
  const [bodyEdited, setBodyEdited] = useState(false)
  const [rows, setRows] = useState<ReportRow[]>(() => [createEmptyRow()])
  const [reportMeta, setReportMeta] = useState<ReportMeta>({
    platform: '',
    locationUnit: '',
    dateMode: 'calendar',
    startDate: '',
    endDate: '',
    directDate: '',
  })
  const [copied, setCopied] = useState<'subject' | 'body' | 'table' | null>(null)

  useEffect(() => {
    saveUserMeta(meta)
  }, [meta])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  const updateMeta = <K extends keyof UserMeta>(key: K, value: UserMeta[K]) => {
    const next = { ...meta, [key]: value }
    setMeta(next)
    if (!subjectEdited) setSubject(createDefaultSubject(next))
    if (!bodyEdited) setBodyHtml(createDefaultBody(next))
  }

  const regenerateTemplates = () => {
    setSubject(createDefaultSubject(meta))
    setBodyHtml(createDefaultBody(meta))
    setSubjectEdited(false)
    setBodyEdited(false)
  }

  const copy = async (kind: 'subject' | 'body' | 'table') => {
    try {
      if (kind === 'subject') await writeClipboard({ plain: subject })
      if (kind === 'body') await writeClipboard(createBodyPayload(bodyHtml))
      if (kind === 'table') {
        await writeClipboard(
          createTablePayload(meta.workTitle, reportMeta, rows, getPublicProjectUrl()),
        )
      }
      setCopied(kind)
    } catch {
      window.alert('복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  const resetAll = () => {
    if (!window.confirm('작성 중인 모든 내용과 저장된 사용자 정보를 초기화할까요?')) return
    clearUserMeta()
    setMeta(EMPTY_USER_META)
    setSubject(createDefaultSubject(EMPTY_USER_META))
    setBodyHtml(createDefaultBody(EMPTY_USER_META))
    setSubjectEdited(false)
    setBodyEdited(false)
    setRows([createEmptyRow()])
    setReportMeta({
      platform: '',
      locationUnit: '',
      dateMode: 'calendar',
      startDate: '',
      endDate: '',
      directDate: '',
    })
  }

  return (
    <main className="page-shell">
      <div className="workspace">
        <header className="app-header">
          <div className="brand-mark" aria-hidden="true">
            <FilePenLine />
          </div>
          <div>
            <p className="eyebrow">TYPO REPORT WRITER</p>
            <h1>오타탈자 제보 작성기</h1>
            <p className="subtitle">메일에 바로 붙여 넣을 제보 내용을 편하게 작성하세요.</p>
          </div>
        </header>

        <aside className="privacy-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>작성 내용은 서버에 저장되지 않습니다.</strong>
            <p>사용자 입력란만 현재 브라우저에 저장되며, 오탈자 표는 창을 닫으면 사라집니다.</p>
          </div>
        </aside>

        <section className="card" aria-labelledby="user-info-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BASIC INFO</p>
              <h2 id="user-info-heading">사용자 입력</h2>
            </div>
            <span className="save-badge">브라우저에 자동 저장</span>
          </div>

          <div className="form-grid">
            <Field
              label="작성자명"
              value={meta.reporterName}
              placeholder="메일에 표시할 이름"
              onChange={(value) => updateMeta('reporterName', value)}
            />
            <Field
              label="작품명"
              required
              value={meta.workTitle}
              placeholder="작품명을 입력하세요"
              onChange={(value) => updateMeta('workTitle', value)}
            />
            <label className="field">
              <span>장르</span>
              <select value={meta.genre} onChange={(event) => updateMeta('genre', event.target.value)}>
                <option value="">장르 선택</option>
                <option>판타지</option>
                <option>무협</option>
                <option>BL</option>
                <option>GL</option>
                <option>로맨스</option>
                <option>로맨스판타지</option>
                <option>기타</option>
              </select>
            </label>
            <Field
              label="출판사명"
              value={meta.publisher}
              placeholder="출판사명"
              onChange={(value) => updateMeta('publisher', value)}
            />
            <Field
              label="작가명"
              value={meta.authorName}
              placeholder="작가명"
              onChange={(value) => updateMeta('authorName', value)}
            />
          </div>
        </section>

        <section className="card" aria-labelledby="mail-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MAIL CONTENT</p>
              <h2 id="mail-heading">메일 제목과 본문</h2>
            </div>
            <button type="button" className="text-button" onClick={regenerateTemplates}>
              <RefreshCcw size={15} />
              기본 문안으로 다시 만들기
            </button>
          </div>

          <div className="copy-block">
            <div className="copy-block__label">
              <label htmlFor="mail-subject">제목</label>
              <CopyButton copied={copied === 'subject'} onClick={() => copy('subject')} />
            </div>
            <input
              id="mail-subject"
              className="subject-input"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value)
                setSubjectEdited(true)
              }}
            />
          </div>

          <div className="copy-block">
            <div className="copy-block__label">
              <span>본문</span>
              <CopyButton copied={copied === 'body'} onClick={() => copy('body')} />
            </div>
            <RichTextEditor
              value={bodyHtml}
              label="메일 본문"
              showToolbar
              onChange={(value) => {
                setBodyHtml(value)
                setBodyEdited(true)
              }}
            />
          </div>
        </section>

        <ReportTable
          workTitle={meta.workTitle}
          reportMeta={reportMeta}
          onReportMetaChange={setReportMeta}
          rows={rows}
          onRowsChange={setRows}
        />

        <div className="bottom-actions">
          <button type="button" className="danger-button" onClick={resetAll}>
            <Trash2 size={17} />
            입력 전체 초기화
          </button>
          <button type="button" className="primary-button" onClick={() => copy('table')}>
            {copied === 'table' ? <Check size={18} /> : <Copy size={18} />}
            {copied === 'table' ? '표를 복사했어요' : '표 복사'}
          </button>
        </div>

        <footer>
          <span>
            <Mail size={15} />
            문의·제안·건의{' '}
            <a href="mailto:gaebal0201@gmail.com">gaebal0201@gmail.com</a>
          </span>
          <span className="footer-divider" aria-hidden="true">·</span>
          <span>
            <GitBranch size={15} />
            <a
              href="https://github.com/icw0201/typo-report-writer"
              target="_blank"
              rel="noreferrer"
            >
              GitHub 저장소
            </a>
          </span>
        </footer>
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  placeholder,
  required = false,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label} {required && <Required />}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function createEmptyRow(): ReportRow {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random()}`,
    location: '',
    original: '',
    correction: '',
    correctionType: 'none',
  }
}

function getPublicProjectUrl(): string {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return ''
  return window.location.origin
}

function Required() {
  return <span className="required" aria-label="필수">*</span>
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button type="button" className="copy-button" onClick={onClick}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? '복사됨' : '복사'}
    </button>
  )
}

export default App
