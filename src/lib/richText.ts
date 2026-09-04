export const HIGHLIGHT_COLOR = '#DCE8FF'

export function applyHighlight(editor: HTMLDivElement | null): void {
  if (!editor) return
  editor.focus()
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand('hiliteColor', false, HIGHLIGHT_COLOR)
}
