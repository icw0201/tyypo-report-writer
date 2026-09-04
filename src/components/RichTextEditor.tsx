import { Bold, Highlighter, Italic, Underline } from 'lucide-react'
import {
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react'
import { applyHighlight } from '../lib/richText'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  label: string
  placeholder?: string
  className?: string
  showToolbar?: boolean
  onEditorFocus?: (element: HTMLDivElement) => void
  editorRef?: RefObject<HTMLDivElement | null>
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  className = '',
  showToolbar = false,
  onEditorFocus,
  editorRef,
  onKeyDown,
}: RichTextEditorProps) {
  const localRef = useRef<HTMLDivElement>(null)
  const ref = editorRef ?? localRef

  useEffect(() => {
    const element = ref.current
    if (element && document.activeElement !== element && element.innerHTML !== value) {
      element.innerHTML = value
    }
  }, [ref, value])

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const plainText = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, plainText)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault()
      applyHighlight(ref.current)
      return
    }
    onKeyDown?.(event)
  }

  return (
    <div className={`rich-editor-wrap ${className}`}>
      {showToolbar && <FormattingToolbar editorRef={ref} />}
      <div
        ref={ref}
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
        onFocus={(event) => onEditorFocus?.(event.currentTarget)}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

interface FormattingToolbarProps {
  editorRef?: RefObject<HTMLDivElement | null>
  getEditor?: () => HTMLDivElement | null
  compact?: boolean
}

export function FormattingToolbar({
  editorRef,
  getEditor,
  compact = false,
}: FormattingToolbarProps) {
  const resolveEditor = () => getEditor?.() ?? editorRef?.current ?? null
  const run = (command: 'bold' | 'italic' | 'underline' | 'highlight') => {
    const editor = resolveEditor()
    if (!editor) return
    if (command === 'highlight') applyHighlight(editor)
    else {
      editor.focus()
      document.execCommand(command)
    }
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }))
  }

  return (
    <div className={`format-toolbar ${compact ? 'format-toolbar--compact' : ''}`} aria-label="서식 도구">
      <FormatButton label="굵게" onRun={() => run('bold')}>
        <Bold size={16} />
      </FormatButton>
      <FormatButton label="기울임" onRun={() => run('italic')}>
        <Italic size={16} />
      </FormatButton>
      <FormatButton label="밑줄" onRun={() => run('underline')}>
        <Underline size={16} />
      </FormatButton>
      <FormatButton label="형광펜 (Ctrl+B)" onRun={() => run('highlight')}>
        <Highlighter size={16} />
      </FormatButton>
    </div>
  )
}

function FormatButton({
  label,
  onRun,
  children,
}: {
  label: string
  onRun: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="format-button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault()
        onRun()
      }}
    >
      {children}
    </button>
  )
}
