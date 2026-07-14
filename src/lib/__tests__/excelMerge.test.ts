import { readFileSync } from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { mergeIntoWorkbook, type LoadedTable, type ReviewedExercise } from '../excelMerge'
import fibl from '../../../data/FIBL.json'
import mchs from '../../../data/MCHS.json'
import type { Exercise } from '../../types/exercise'

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
]

async function buildSampleWorkbook(rows: Record<string, unknown>[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('exercise_processing_log')
  sheet.addRow(LOG_COLUMNS)
  for (const row of rows) {
    sheet.addRow(LOG_COLUMNS.map((col) => row[col] ?? null))
  }
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ArrayBuffer
}

async function loadWorkbook(buffer: ExcelJS.Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return workbook
}

function cellText(worksheet: ExcelJS.Worksheet, rowNumber: number, header: string): unknown {
  const headerRow = worksheet.getRow(1)
  let colNumber = -1
  headerRow.eachCell((cell, colNum) => {
    if (cell.value === header) colNumber = colNum
  })
  return worksheet.getRow(rowNumber).getCell(colNumber).value
}

const reviewedFibl: ReviewedExercise = {
  filename: 'row-a.json',
  exercise: fibl as Exercise,
  status: 'validated',
}

const reviewedMchsRejected: ReviewedExercise = {
  filename: 'row-b.json',
  exercise: mchs as Exercise,
  status: 'rejected',
  reasoning: 'Answer key is wrong',
}

const reviewedOrphan: ReviewedExercise = {
  filename: 'orphan.json',
  exercise: fibl as Exercise,
  status: 'validated',
}

describe('mergeIntoWorkbook', () => {
  it('writes validation metadata into a matched row and preserves the rest', async () => {
    const buffer = await buildSampleWorkbook([
      { R_PROYECTO: 'ELT', idJson: 'row-a.json', idPregunta: 'row-a.json', question_type: 'FIBL' },
      { R_PROYECTO: 'ELT', idJson: 'row-untouched.json', idPregunta: 'row-untouched.json', question_type: 'SHRT' },
    ])

    const outBuffer = await mergeIntoWorkbook({
      workbookBuffer: buffer,
      reviewed: [reviewedFibl],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const sheet = workbook.getWorksheet('exercise_processing_log')!

    expect(cellText(sheet, 2, 'validation_status')).toBe('OK')
    expect(cellText(sheet, 2, 'Aprobada')).toBe('reviewer@example.com')
    expect(cellText(sheet, 2, 'timestamp')).toBe('2026-01-01T00:00:00.000Z')

    // unmatched row stays untouched
    expect(cellText(sheet, 3, 'idJson')).toBe('row-untouched.json')
    expect(cellText(sheet, 3, 'validation_status')).toBeNull()
    expect(cellText(sheet, 3, 'Aprobada')).toBeNull()
  })

  it('writes rejection reasoning into a new reasoning column', async () => {
    const buffer = await buildSampleWorkbook([
      { R_PROYECTO: 'ELT', idJson: 'row-b.json', idPregunta: 'row-b.json', question_type: 'MCHS' },
    ])

    const outBuffer = await mergeIntoWorkbook({
      workbookBuffer: buffer,
      reviewed: [reviewedMchsRejected],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const sheet = workbook.getWorksheet('exercise_processing_log')!
    expect(cellText(sheet, 2, 'validation_status')).toBe('KO')
    expect(cellText(sheet, 2, 'reasoning')).toBe('Answer key is wrong')
  })

  it('appends exercises with no matching row to an UNKNOWN sheet', async () => {
    const buffer = await buildSampleWorkbook([
      { R_PROYECTO: 'ELT', idJson: 'row-a.json', idPregunta: 'row-a.json', question_type: 'FIBL' },
    ])

    const outBuffer = await mergeIntoWorkbook({
      workbookBuffer: buffer,
      reviewed: [reviewedFibl, reviewedOrphan],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const mainSheet = workbook.getWorksheet('exercise_processing_log')!
    expect(cellText(mainSheet, 2, 'validation_status')).toBe('OK')

    const unknownSheet = workbook.getWorksheet('UNKNOWN')!
    expect(unknownSheet).toBeDefined()
    expect(cellText(unknownSheet, 2, 'idJson')).toBe('orphan.json')
    expect(cellText(unknownSheet, 2, 'question_type')).toBe('FIBL')
    expect(cellText(unknownSheet, 2, 'validation_status')).toBe('OK')
  })

  it('handles matched, unmatched, and orphan rows together (three-way merge)', async () => {
    const buffer = await buildSampleWorkbook([
      { R_PROYECTO: 'ELT', idJson: 'row-a.json', idPregunta: 'row-a.json', question_type: 'FIBL' },
      { R_PROYECTO: 'ELT', idJson: 'row-untouched.json', idPregunta: 'row-untouched.json', question_type: 'SHRT' },
    ])

    const outBuffer = await mergeIntoWorkbook({
      workbookBuffer: buffer,
      reviewed: [reviewedFibl, reviewedOrphan],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const mainSheet = workbook.getWorksheet('exercise_processing_log')!
    expect(mainSheet.lastRow!.number).toBe(3)
    expect(cellText(mainSheet, 2, 'validation_status')).toBe('OK')
    expect(cellText(mainSheet, 3, 'idJson')).toBe('row-untouched.json')
    expect(cellText(mainSheet, 3, 'validation_status')).toBeNull()

    const unknownSheet = workbook.getWorksheet('UNKNOWN')!
    expect(cellText(unknownSheet, 2, 'idJson')).toBe('orphan.json')
  })

  it('builds a fresh workbook when no existing workbook is uploaded', async () => {
    const outBuffer = await mergeIntoWorkbook({
      reviewed: [reviewedFibl, reviewedMchsRejected],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const sheet = workbook.getWorksheet('exercise_processing_log')!
    expect(sheet.lastRow!.number).toBe(3)
    expect(cellText(sheet, 2, 'idJson')).toBe('row-a.json')
    expect(cellText(sheet, 2, 'validation_status')).toBe('OK')
    expect(cellText(sheet, 3, 'idJson')).toBe('row-b.json')
    expect(cellText(sheet, 3, 'validation_status')).toBe('KO')
    expect(cellText(sheet, 3, 'reasoning')).toBe('Answer key is wrong')
  })

  it('does not corrupt the real tracking workbook\'s Excel Table definition', async () => {
    const realWorkbookPath = path.join(import.meta.dirname, '../../../data/exercise_processing_log_carga.xlsx')
    const buffer = readFileSync(realWorkbookPath)

    const reviewed: ReviewedExercise = {
      filename: 'INSPO_TRB5_Grammar_Worksheets_p001_ex1.json',
      exercise: fibl as Exercise,
      status: 'validated',
    }

    const outBuffer = await mergeIntoWorkbook({
      workbookBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      reviewed: [reviewed],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const sheet = workbook.getWorksheet('exercise_processing_log')!
    const tables = sheet.getTables() as unknown as LoadedTable[]

    expect(tables).toHaveLength(1)
    // headerRow must round-trip as true so ExcelJS doesn't emit headerRowCount="0"
    // alongside a populated <autoFilter>/<filterColumn> block — that combination is
    // what Excel considers corrupt and silently repairs by deleting the autoFilter.
    expect(tables[0].table.headerRow).toBe(true)

    expect(cellText(sheet, 2, 'validation_status')).toBe('OK')
  })

  it('adds the reasoning column right after the last named header, ignoring trailing style-only cells', async () => {
    // The real workbook's header row has a formatted-but-valueless spacer cell
    // right after `timestamp` (column M). Row.cellCount counts that spacer, so
    // basing the "next column" on cellCount used to append `reasoning` one
    // column too far right (N), leaving M permanently blank on every export.
    const realWorkbookPath = path.join(import.meta.dirname, '../../../data/exercise_processing_log_carga.xlsx')
    const buffer = readFileSync(realWorkbookPath)

    const reviewed: ReviewedExercise = {
      filename: 'INSPO_TRB5_Grammar_Worksheets_p001_ex1.json',
      exercise: mchs as Exercise,
      status: 'rejected',
      reasoning: 'bad answer key',
    }

    const outBuffer = await mergeIntoWorkbook({
      workbookBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      reviewed: [reviewed],
      reviewerEmail: 'reviewer@example.com',
      timestamp: '2026-01-01T00:00:00.000Z',
    })

    const workbook = await loadWorkbook(outBuffer)
    const sheet = workbook.getWorksheet('exercise_processing_log')!
    const headerRow = sheet.getRow(1)

    expect(headerRow.getCell(13).value).toBe('reasoning')
    expect(cellText(sheet, 2, 'reasoning')).toBe('bad answer key')
  })
})
