import Ajv, { type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import exerciseSchema from '../../data/exercise-schema.json'
import type { Exercise } from '../types/exercise'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validateAgainstSchema = ajv.compile(exerciseSchema)

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors) return []
  return errors.map((err) => {
    const path = err.instancePath || '(root)'
    return `${path} ${err.message ?? 'is invalid'}`
  })
}

export function validateExercise(data: unknown): ValidationResult {
  const valid = validateAgainstSchema(data)
  return { valid: Boolean(valid), errors: formatErrors(validateAgainstSchema.errors) }
}

export function isExercise(data: unknown): data is Exercise {
  return validateExercise(data).valid
}
