import React, { useState } from 'react';

interface ValidationFormProps {
  onSubmit: (validated: boolean, reasoning?: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canNext: boolean;
  canPrevious: boolean;
  currentIndex: number;
  totalQuestions: number;
}

export const ValidationForm: React.FC<ValidationFormProps> = ({
  onSubmit,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
  currentIndex,
  totalQuestions,
}) => {
  const [reasoning, setReasoning] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showReasoningField, setShowReasoningField] = useState(false);

  const handleValidate = () => {
    onSubmit(true);
    setSubmitted(true);
    setReasoning('');
    setShowReasoningField(false);
  };

  const handleReject = () => {
    setShowReasoningField(true);
  };

  const handleConfirmReject = () => {
    if (!reasoning.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onSubmit(false, reasoning);
    setSubmitted(true);
    setReasoning('');
    setShowReasoningField(false);
  };

  const handleCancelReject = () => {
    setShowReasoningField(false);
    setReasoning('');
  };

  const handleNextClick = () => {
    if (canNext) {
      onNext();
      setSubmitted(false);
      setShowReasoningField(false);
      setReasoning('');
    }
  };

  const handlePreviousClick = () => {
    if (canPrevious) {
      onPrevious();
      setSubmitted(false);
      setShowReasoningField(false);
      setReasoning('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Question {currentIndex + 1} of {totalQuestions}
        </p>
      </div>

      {!showReasoningField && !submitted && (
        <div className="flex flex-col gap-4">
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
          >
            ✓ Validate
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {showReasoningField && !submitted && (
        <div className="space-y-4">
          <label htmlFor="reasoning" className="block text-gray-700 font-medium">
            Please provide a reason for rejection:
          </label>
          <textarea
            id="reasoning"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Enter the reason why this question should be rejected..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            rows={4}
          />
          <div className="flex gap-3">
            <button
              onClick={handleConfirmReject}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
            >
              ✗ Confirm Rejection
            </button>
            <button
              onClick={handleCancelReject}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePreviousClick}
          disabled={!canPrevious}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-400 font-medium transition"
        >
          ← Previous
        </button>
        <button
          onClick={handleNextClick}
          disabled={!canNext}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:text-gray-400 font-medium transition"
        >
          Next →
        </button>
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✓ Question submitted successfully!
          </p>
        </div>
      )}
    </div>
  );
};
