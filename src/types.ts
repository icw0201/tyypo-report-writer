export interface UserMeta {
  reporterName: string
  workTitle: string
  genre: string
  publisher: string
  authorName: string
}

export interface ReportMeta {
  platform: string
  locationUnit: 'episode' | 'volume' | ''
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
  correctionType:
    | 'none'
    | 'spacing'
    | 'symbol'
    | 'properNoun'
    | 'format'
    | 'polite'
}

export type EditableColumn = 'original' | 'correction'
