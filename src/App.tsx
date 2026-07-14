import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { QuestionDisplay } from './components/QuestionDisplay'
import { ValidationForm, type ValidationState } from './components/ValidationForm'
import { parseExerciseFiles, type ParsedFile } from './lib/parseExercises'
import { mergeIntoWorkbook, type ReviewedExercise } from './lib/excelMerge'

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [validations, setValidations] = useState<Record<string, ValidationState>>({})
  const [workbookFile, setWorkbookFile] = useState<File | null>(null)
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const validExercises = parsedFiles.filter((f) => f.valid && f.exercise)
  const current = validExercises[currentIndex]

  async function handleJsonFiles(files: File[]) {
    const parsed = await parseExerciseFiles(files)
    setParsedFiles((prev) => [...prev, ...parsed])
  }

  function handleExcelFile(files: File[]) {
    setWorkbookFile(files[0] ?? null)
  }

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, validExercises.length - 1)))
  }

  function setStatus(filename: string, state: ValidationState) {
    setValidations((prev) => ({ ...prev, [filename]: state }))
    if (currentIndex < validExercises.length - 1) {
      goTo(currentIndex + 1)
    }
  }

  const validatedCount = Object.values(validations).filter((v) => v.status === 'validated').length
  const rejectedCount = Object.values(validations).filter((v) => v.status === 'rejected').length
  const pendingCount = validExercises.length - validatedCount - rejectedCount
  const reviewedCount = validatedCount + rejectedCount
  const canExport = reviewedCount > 0 && reviewerEmail.trim().length > 0

  function handleReset() {
    setParsedFiles([])
    setCurrentIndex(0)
    setValidations({})
    setWorkbookFile(null)
    setReviewerEmail('')
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const reviewed: ReviewedExercise[] = validExercises
        .filter((f) => validations[f.filename]?.status !== undefined && validations[f.filename]?.status !== 'pending')
        .map((f) => ({
          filename: f.filename,
          exercise: f.exercise!,
          status: validations[f.filename]!.status as 'validated' | 'rejected',
          reasoning: validations[f.filename]!.reasoning,
        }))

      const workbookBuffer = workbookFile ? await workbookFile.arrayBuffer() : undefined
      const outputBuffer = await mergeIntoWorkbook({
        workbookBuffer,
        reviewed,
        reviewerEmail: reviewerEmail.trim(),
      })

      const baseName = workbookFile ? workbookFile.name.replace(/\.xlsx$/i, '') : 'export'
      downloadBuffer(outputBuffer as ArrayBuffer, `${baseName}_validation_${Date.now()}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">OUPE JSON Validator</h1>
        <button type="button" onClick={handleReset} className="rounded border px-4 py-2 text-sm">
          Reset
        </button>
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4">
        <FileUpload
          label="Drag and drop exercise JSON files here, or click to browse"
          accept="application/json"
          multiple
          onFiles={handleJsonFiles}
        />
        <FileUpload
          label={workbookFile ? `Tracking workbook: ${workbookFile.name}` : 'Drag and drop the tracking .xlsx here (optional)'}
          accept=".xlsx"
          onFiles={handleExcelFile}
        />
      </div>

      {parsedFiles.some((f) => !f.valid) && (
        <ul className="mt-4 space-y-1 text-sm text-red-700">
          {parsedFiles
            .filter((f) => !f.valid)
            .map((f) => (
              <li key={f.filename}>
                {f.filename} — {f.errors.join('; ')}
              </li>
            ))}
        </ul>
      )}

      {validExercises.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Question {currentIndex + 1} of {validExercises.length}
            </span>
            <span>
              {validatedCount} validated · {rejectedCount} rejected · {pendingCount} pending
            </span>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <p className="mb-4 text-xs text-gray-400">{current.filename}</p>
            <QuestionDisplay exercise={current.exercise!} />
            <ValidationForm
              value={validations[current.filename] ?? { status: 'pending' }}
              onValidate={() => setStatus(current.filename, { status: 'validated' })}
              onReject={(reasoning) => setStatus(current.filename, { status: 'rejected', reasoning })}
            />
          </div>

          <div className="mt-4 flex justify-between">
            <button
              type="button"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="rounded border px-4 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === validExercises.length - 1}
              className="rounded border px-4 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="mt-8 flex items-end gap-3 border-t pt-6">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500" htmlFor="reviewer-email">
                Reviewer email
              </label>
              <input
                id="reviewer-email"
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded border border-gray-300 p-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport || isExporting}
              className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {isExporting ? 'Exporting…' : 'Export to Excel'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
