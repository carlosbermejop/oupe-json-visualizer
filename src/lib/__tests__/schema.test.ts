import { describe, expect, it } from 'vitest'
import { validateExercise } from '../schema'
import fibl from '../../../data/FIBL.json'
import mchs from '../../../data/MCHS.json'
import shrt from '../../../data/SHRT.json'
import wrod from '../../../data/WROD.json'
import wque from '../../../data/WQUE.json'
import essay from '../../../data/ESSAY.json'
import mtch from '../../../data/MTCH.json'

describe('validateExercise', () => {
  it.each([
    ['FIBL', fibl],
    ['MCHS', mchs],
    ['SHRT', shrt],
    ['WROD', wrod],
    ['WQUE', wque],
    ['ESSAY', essay],
    ['MTCH', mtch],
  ])('accepts a valid %s fixture', (_type, fixture) => {
    const result = validateExercise(fixture)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('rejects MCHS missing options', () => {
    const broken = { ...mchs, options: undefined }
    const result = validateExercise(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('options'))).toBe(true)
  })

  it('rejects WROD missing scrambled_words', () => {
    const broken = { ...wrod, scrambled_words: undefined }
    const result = validateExercise(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('scrambled_words'))).toBe(true)
  })

  it('rejects MTCH missing match_options', () => {
    const broken = { ...mtch, match_options: undefined }
    const result = validateExercise(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('match_options'))).toBe(true)
  })

  it('rejects ESSAY with non-empty solutions', () => {
    const broken = { ...essay, solutions: ['not allowed'] }
    const result = validateExercise(broken)
    expect(result.valid).toBe(false)
  })

  it('rejects non-ESSAY exercise with empty solutions', () => {
    const broken = { ...fibl, solutions: [] }
    const result = validateExercise(broken)
    expect(result.valid).toBe(false)
  })

  it('rejects an exercise with an unknown type', () => {
    const broken = { ...fibl, type: 'BOGUS' }
    const result = validateExercise(broken)
    expect(result.valid).toBe(false)
  })

  it('rejects a completely empty object', () => {
    const result = validateExercise({})
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
