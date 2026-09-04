import type { UserMeta } from '../types'

export const EMPTY_USER_META: UserMeta = {
  reporterName: '',
  workTitle: '',
  genre: '',
  publisher: '',
  authorName: '',
}

export function createDefaultSubject(meta: UserMeta): string {
  const publisher = meta.publisher || '출판사명'
  const genre = meta.genre || '장르명'
  const title = meta.workTitle || '작품명'

  return `[오탈자 제보] ${publisher} ${genre} 《${title}》 오탈자 제보 드립니다`
}

export function createDefaultBody(meta: UserMeta): string {
  const author = meta.authorName || '작가명'
  const title = meta.workTitle || '작품명'
  const reporter = meta.reporterName || '작성자명'

  return [
    '<p>안녕하세요.</p>',
    `<p>${escapeHtml(author)}님이 연재 중인 《${escapeHtml(title)}》의 오탈자를 발견하여 제보 드립니다.<br>작은 부분이지만 책의 완성도를 높이는 데 도움이 되었으면 좋겠습니다.</p>`,
    `<p>늘 좋은 책을 만들어주셔서 감사합니다.<br>독자 ${escapeHtml(reporter)} 드림</p>`,
  ].join('')
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
