import ExcelJS from 'exceljs'
import type { Exercise } from '../types/exercise'

export type ReviewedStatus = 'validated' | 'rejected'

export interface ReviewedExercise {
  filename: string
  exercise: Exercise
  status: ReviewedStatus
  reasoning?: string
}

export interface MergeInput {
  workbookBuffer?: ArrayBuffer
  reviewed: ReviewedExercise[]
  reviewerEmail: string
  timestamp?: string
}

const MATCH_COLUMN = 'idJson'
const REASONING_COLUMN = 'reasoning'
const UNKNOWN_SHEET_NAME = 'UNKNOWN'
const DEFAULT_SHEET_NAME = 'exercise_processing_log'

const LOG_COLUMNS = [
  'R_PROYECTO',
  'idTitulo',
  'idPregunta',
  'idJson',
  'idEstructura',
  'question_type',
  'idIdioma',
  'IIdCompetencia',
  'Dificultad',
  'validation_status',
  'Aprobada',
  'timestamp',
  REASONING_COLUMN,
]

// exceljs's type declarations don't match the runtime shape of a loaded
// Table (they model TableProperties directly instead of the wrapper class
// with a nested `.table` model and a `.commit()` method).
export interface LoadedTable {
  table: { headerRow?: boolean }
  commit: () => void
}

function fixTableHeaderRowFlags(workbook: ExcelJS.Workbook) {
  // ExcelJS's OOXML parser doesn't apply the spec default for a table's
  // headerRowCount attribute (1, i.e. "has a header row") when the attribute
  // is omitted from the source file. It reads that as headerRow: false, then
  // re-serializes headerRowCount="0" while still writing a full <autoFilter>
  // with per-column <filterColumn> entries — a combination Excel considers
  // corrupt and repairs by deleting the autoFilter. Every table this app
  // writes has its header in row 1, so force the flag back to true.
  workbook.eachSheet((worksheet) => {
    const tables = worksheet.getTables() as unknown as LoadedTable[]
    tables.forEach((table) => {
      if (table.table.headerRow === false) {
        table.table.headerRow = true
        table.commit()
      }
    })
  })
}

function validationStatusValue(status: ReviewedStatus): 'OK' | 'KO' {
  return status === 'validated' ? 'OK' : 'KO'
}

type HeaderMap = Map<string, number>

function getHeaderMap(worksheet: ExcelJS.Worksheet): HeaderMap {
  const map: HeaderMap = new Map()
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const value = cell.value
    if (typeof value === 'string' && value.trim()) {
      map.set(value.trim(), colNumber)
    }
  })
  return map
}

function ensureColumn(worksheet: ExcelJS.Worksheet, headerMap: HeaderMap, name: string): number {
  const existing = headerMap.get(name)
  if (existing) return existing
  // Row.cellCount includes trailing cells with no value but a style (e.g. the
  // formatted spacer column at the end of the real workbook's header row), so
  // it can overshoot the last *named* header column. Base the next column on
  // the highest column we actually found a header in instead.
  const lastNamedCol = Math.max(0, ...headerMap.values())
  const nextCol = lastNamedCol + 1
  worksheet.getRow(1).getCell(nextCol).value = name
  headerMap.set(name, nextCol)
  return nextCol
}

function applyReviewToRow(
  worksheet: ExcelJS.Worksheet,
  headerMap: HeaderMap,
  rowNumber: number,
  review: ReviewedExercise,
  reviewerEmail: string,
  timestamp: string,
) {
  const statusCol = headerMap.get('validation_status')
  const approverCol = headerMap.get('Aprobada')
  const timestampCol = headerMap.get('timestamp')
  const reasoningCol = ensureColumn(worksheet, headerMap, REASONING_COLUMN)

  const row = worksheet.getRow(rowNumber)
  if (statusCol) row.getCell(statusCol).value = validationStatusValue(review.status)
  if (approverCol) row.getCell(approverCol).value = reviewerEmail
  if (timestampCol) row.getCell(timestampCol).value = timestamp
  row.getCell(reasoningCol).value = review.reasoning ?? ''
  row.commit()
}

function matchAndApply(
  workbook: ExcelJS.Workbook,
  reviewedByFilename: Map<string, ReviewedExercise>,
  matched: Set<string>,
  reviewerEmail: string,
  timestamp: string,
) {
  workbook.eachSheet((worksheet) => {
    if (worksheet.name === UNKNOWN_SHEET_NAME) return
    const headerMap = getHeaderMap(worksheet)
    const matchCol = headerMap.get(MATCH_COLUMN)
    if (!matchCol) return

    const lastRow = worksheet.lastRow?.number ?? 1
    for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const cellValue = row.getCell(matchCol).value
      const filename = typeof cellValue === 'string' ? cellValue.trim() : undefined
      if (!filename) continue

      const review = reviewedByFilename.get(filename)
      if (!review) continue

      applyReviewToRow(worksheet, headerMap, rowNumber, review, reviewerEmail, timestamp)
      matched.add(filename)
    }
  })
}

function appendOrphans(
  workbook: ExcelJS.Workbook,
  orphans: ReviewedExercise[],
  reviewerEmail: string,
  timestamp: string,
) {
  if (orphans.length === 0) return

  let sheet = workbook.getWorksheet(UNKNOWN_SHEET_NAME)
  if (!sheet) {
    sheet = workbook.addWorksheet(UNKNOWN_SHEET_NAME)
    sheet.addRow(LOG_COLUMNS)
  }
  const headerMap = getHeaderMap(sheet)

  for (const review of orphans) {
    const rowNumber = (sheet.lastRow?.number ?? 1) + 1
    sheet.getRow(rowNumber).values = []
    const set = (name: string, value: ExcelJS.CellValue) => {
      const col = ensureColumn(sheet!, headerMap, name)
      sheet!.getRow(rowNumber).getCell(col).value = value
    }
    set('idPregunta', review.filename)
    set(MATCH_COLUMN, review.filename)
    set('question_type', review.exercise.type)
    set('idIdioma', 'EN')
    set('IIdCompetencia', review.exercise.competence.join(', '))
    set('validation_status', validationStatusValue(review.status))
    set('Aprobada', reviewerEmail)
    set('timestamp', timestamp)
    set(REASONING_COLUMN, review.reasoning ?? '')
    sheet.getRow(rowNumber).commit()
  }
}

function buildFreshWorkbook(
  reviewed: ReviewedExercise[],
  reviewerEmail: string,
  timestamp: string,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(DEFAULT_SHEET_NAME)
  sheet.addRow(LOG_COLUMNS)
  const headerMap = getHeaderMap(sheet)

  for (const review of reviewed) {
    const rowNumber = sheet.lastRow!.number + 1
    const set = (name: string, value: ExcelJS.CellValue) => {
      const col = ensureColumn(sheet, headerMap, name)
      sheet.getRow(rowNumber).getCell(col).value = value
    }
    set('idPregunta', review.filename)
    set(MATCH_COLUMN, review.filename)
    set('question_type', review.exercise.type)
    set('idIdioma', 'EN')
    set('IIdCompetencia', review.exercise.competence.join(', '))
    set('validation_status', validationStatusValue(review.status))
    set('Aprobada', reviewerEmail)
    set('timestamp', timestamp)
    set(REASONING_COLUMN, review.reasoning ?? '')
    sheet.getRow(rowNumber).commit()
  }

  return workbook
}

export async function mergeIntoWorkbook(input: MergeInput): Promise<ExcelJS.Buffer> {
  const timestamp = input.timestamp ?? new Date().toISOString()
  const reviewedByFilename = new Map(input.reviewed.map((r) => [r.filename, r]))

  let workbook: ExcelJS.Workbook

  if (input.workbookBuffer) {
    workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(input.workbookBuffer)
    fixTableHeaderRowFlags(workbook)

    const matched = new Set<string>()
    matchAndApply(workbook, reviewedByFilename, matched, input.reviewerEmail, timestamp)

    const orphans = input.reviewed.filter((r) => !matched.has(r.filename))
    appendOrphans(workbook, orphans, input.reviewerEmail, timestamp)
  } else {
    workbook = buildFreshWorkbook(input.reviewed, input.reviewerEmail, timestamp)
  }

  return workbook.xlsx.writeBuffer()
}
