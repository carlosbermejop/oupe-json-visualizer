import { useState } from 'react'

export type ExerciseStatus = 'pending' | 'validated' | 'rejected'

export interface ValidationState {
  status: ExerciseStatus
  reasoning?: string
}

interface ValidationFormProps {
  value: ValidationState
  onValidate: () => void
  onReject: (reasoning: string) => void
}

export function ValidationForm({ value, onValidate, onReject }: ValidationFormProps) {
  const [reasoning, setReasoning] = useState(value.reasoning ?? '')
  const [showReasonInput, setShowReasonInput] = useState(false)

  function handleReject() {
    if (!showReasonInput) {
      setShowReasonInput(true)
      return
    }
    if (!reasoning.trim()) return
    onReject(reasoning.trim())
    setShowReasonInput(false)
  }

  return (
    <div className="space-y-3 border-t pt-4">
      {showReasonInput && (
        <textarea
          className="w-full rounded border border-gray-300 p-2 text-sm"
          placeholder="Reasoning for rejection (required)"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
        />
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onValidate}
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Validate
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={showReasonInput && !reasoning.trim()}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {showReasonInput ? 'Confirm rejection' : 'Reject'}
        </button>
      </div>
      {value.status !== 'pending' && (
        <p className="text-sm text-gray-500">
          Status: <span className="font-medium">{value.status}</span>
          {value.reasoning ? ` — ${value.reasoning}` : ''}
        </p>
      )}
    </div>
  )
}
