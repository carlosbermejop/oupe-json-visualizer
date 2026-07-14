export type ExerciseType = 'FIBL' | 'MCHS' | 'SHRT' | 'WROD' | 'WQUE' | 'ESSAY' | 'MTCH'

export type Competence =
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'READING'
  | 'WRITING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'SPELLING'

export interface ExerciseSource {
  pdf?: string
  page?: number
  [key: string]: unknown
}

interface ExerciseBase {
  type: ExerciseType
  competence: Competence[]
  question: string
  text_with_gaps: string[]
  solutions: string[]
  assets: string[]
  _source?: ExerciseSource
}

export interface FiblExercise extends ExerciseBase {
  type: 'FIBL'
  word_bank?: string[]
}

export interface MchsExercise extends ExerciseBase {
  type: 'MCHS'
  options: string[]
}

export interface ShrtExercise extends ExerciseBase {
  type: 'SHRT'
}

export interface WrodExercise extends ExerciseBase {
  type: 'WROD'
  scrambled_words: string[]
}

export interface WqueExercise extends ExerciseBase {
  type: 'WQUE'
}

export interface EssayExercise extends ExerciseBase {
  type: 'ESSAY'
  solutions: []
}

export interface MtchExercise extends ExerciseBase {
  type: 'MTCH'
  match_options: Record<string, string>
}

export type Exercise =
  | FiblExercise
  | MchsExercise
  | ShrtExercise
  | WrodExercise
  | WqueExercise
  | EssayExercise
  | MtchExercise

export interface UploadedExercise {
  filename: string
  exercise: Exercise
}
