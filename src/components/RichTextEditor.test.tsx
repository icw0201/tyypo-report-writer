import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RichTextEditor } from './RichTextEditor'

describe('서식 편집기', () => {
  it('포커스 중 다시 렌더링되어도 한글 조합과 줄 순서를 유지한다', () => {
    const onChange = () => undefined
    const { rerender } = render(
      <RichTextEditor value="" onChange={onChange} label="테스트 편집기" />,
    )
    const editor = screen.getByRole('textbox', { name: '테스트 편집기' })
    editor.focus()
    editor.innerHTML = '한국어<div>입력</div>'
    fireEvent.input(editor)

    rerender(
      <RichTextEditor
        value="한국어<div>입력</div>"
        onChange={onChange}
        label="테스트 편집기"
      />,
    )

    expect(editor.innerHTML).toBe('한국어<div>입력</div>')
  })
})
