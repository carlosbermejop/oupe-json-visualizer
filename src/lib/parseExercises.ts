import { validateExercise } from './schema'
import type { Exercise } from '../types/exercise'

export interface ParsedFile {
  filename: string
  exercise: Exercise | null
  valid: boolean
  errors: string[]
}

function baseName(filename: string): string {
  return filename.replace(/\.json$/i, '')
}

function parseEntry(filename: string, entry: unknown, index: number, total: number): ParsedFile {
  const name = total > 1 ? `${baseName(filename)}_${index + 1}.json` : filename
  const result = validateExercise(entry)
  return {
    filename: name,
    exercise: result.valid ? (entry as Exercise) : null,
    valid: result.valid,
    errors: result.errors,
  }
}

export async function parseExerciseFile(file: File): Promise<ParsedFile[]> {
  const text = await file.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return [
      {
        filename: file.name,
        exercise: null,
        valid: false,
        errors: ['File is not valid JSON'],
      },
    ]
  }

  const entries = Array.isArray(data) ? data : [data]
  return entries.map((entry, index) => parseEntry(file.name, entry, index, entries.length))
}

export async function parseExerciseFiles(files: File[]): Promise<ParsedFile[]> {
  const results = await Promise.all(files.map(parseExerciseFile))
  return results.flat()
}
