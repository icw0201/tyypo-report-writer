export interface UserMeta {
  reporterName: string
  workTitle: string
  genre: string
  publisher: string
  authorName: string
}

export interface ReportMeta {
  platform: string
  dateMode: 'calendar' | 'direct'
  startDate: string
  endDate: string
  directDate: string
}

export interface ReportRow {
  id: string
  location: string
  original: string
  correction: string
}

export type EditableColumn = 'location' | 'original' | 'correction'
