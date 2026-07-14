import { describe, expect, it } from 'vitest'
import { parseExerciseFile, parseExerciseFiles } from '../parseExercises'
import fibl from '../../../data/FIBL.json'
import mchs from '../../../data/MCHS.json'

function jsonFile(name: string, data: unknown): File {
  return new File([JSON.stringify(data)], name, { type: 'application/json' })
}

describe('parseExerciseFile', () => {
  it('parses a single exercise object', async () => {
    const file = jsonFile('exA.json', fibl)
    const parsed = await parseExerciseFile(file)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].filename).toBe('exA.json')
    expect(parsed[0].valid).toBe(true)
    expect(parsed[0].exercise?.type).toBe('FIBL')
  })

  it('parses an array of exercises into separate entries with suffixed filenames', async () => {
    const file = jsonFile('batch.json', [fibl, mchs])
    const parsed = await parseExerciseFile(file)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].filename).toBe('batch_1.json')
    expect(parsed[1].filename).toBe('batch_2.json')
    expect(parsed.every((p) => p.valid)).toBe(true)
  })

  it('reports invalid JSON without throwing', async () => {
    const file = new File(['not json'], 'broken.json')
    const parsed = await parseExerciseFile(file)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].valid).toBe(false)
    expect(parsed[0].errors[0]).toMatch(/not valid JSON/)
  })

  it('reports schema validation errors for an invalid exercise', async () => {
    const file = jsonFile('bad.json', { type: 'FIBL' })
    const parsed = await parseExerciseFile(file)
    expect(parsed[0].valid).toBe(false)
    expect(parsed[0].errors.length).toBeGreaterThan(0)
  })
})

describe('parseExerciseFiles', () => {
  it('flattens results across multiple files', async () => {
    const files = [jsonFile('a.json', fibl), jsonFile('b.json', [mchs, fibl])]
    const parsed = await parseExerciseFiles(files)
    expect(parsed).toHaveLength(3)
    expect(parsed.map((p) => p.filename)).toEqual(['a.json', 'b_1.json', 'b_2.json'])
  })
})
