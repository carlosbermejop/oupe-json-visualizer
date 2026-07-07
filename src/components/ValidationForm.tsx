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
  const [isValidated, setIsValidated] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleValidate = () => {
    onSubmit(true);
    setSubmitted(true);
    setIsValidated(false);
    setReasoning('');
  };

  const handleReject = () => {
    if (!reasoning.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onSubmit(false, reasoning);
    setSubmitted(true);
    setIsValidated(false);
    setReasoning('');
  };

  const handleNextClick = () => {
    if (canNext) {
      onNext();
      setSubmitted(false);
    }
  };

  const handlePreviousClick = () => {
    if (canPrevious) {
      onPrevious();
      setSubmitted(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Question {currentIndex + 1} of {totalQuestions}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isValidated}
              onChange={(e) => setIsValidated(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
              disabled={submitted}
            />
            <span className="text-gray-700 font-medium">This question is valid</span>
          </label>
        </div>

        {!isValidated && (
          <div>
            <label htmlFor="reasoning" className="block text-gray-700 font-medium mb-2">
              Reason for rejection (required if not validating):
            </label>
            <textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Enter the reason why this question should be rejected..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
              disabled={submitted}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <button
            onClick={handleValidate}
            disabled={submitted}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
          >
            ✓ Validate
          </button>
          <button
            onClick={handleReject}
            disabled={submitted || !reasoning.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium transition"
          >
            ✗ Reject
          </button>
        </div>

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
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✓ Question {isValidated ? 'validated' : 'rejected'} successfully!
          </p>
        </div>
      )}
    </div>
  );
};
