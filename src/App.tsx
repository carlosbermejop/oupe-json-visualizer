import { useState } from 'react';
import { Question } from './types/index';
import { FileUpload } from './components/FileUpload';
import { QuestionDisplay } from './components/QuestionDisplay';
import { ValidationForm } from './components/ValidationForm';
import { generateExcel, downloadExcel, ValidationState } from './lib/excel';
import './App.css';

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validations, setValidations] = useState<ValidationState>({});
  const [error, setError] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleUpload = (uploadedQuestions: Question[], uploadedFileName: string) => {
    setQuestions(uploadedQuestions);
    setFileName(uploadedFileName);
    setCurrentIndex(0);
    setValidations({});
    setError('');
  };

  const handleValidation = (validated: boolean, reasoning?: string) => {
    setValidations({
      ...validations,
      [currentIndex]: {
        validated,
        reasoning,
      },
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleExport = async () => {
    if (Object.keys(validations).length === 0) {
      setError('Please validate or reject at least one question');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await generateExcel(questions, fileName, validations);
      const exportFileName = `${fileName.replace('.json', '')}_validation_${new Date().getTime()}.xlsx`;
      downloadExcel(blob, exportFileName);
      setError('');
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setFileName('');
    setCurrentIndex(0);
    setValidations({});
    setError('');
  };

  const validatedCount = Object.values(validations).filter((v) => v.validated).length;
  const rejectedCount = Object.values(validations).filter((v) => !v.validated).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 JSON Question Validator
          </h1>
          <p className="text-gray-600">
            Validate and export questions from JSON files to Excel
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {!questions.length ? (
            // Upload State
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Get Started
              </h2>
              <FileUpload onUpload={handleUpload} onError={setError} />
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Validation State
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {fileName}
                </h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700">
                      Validated: <span className="font-bold">{validatedCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-gray-700">
                      Rejected: <span className="font-bold">{rejectedCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                    <span className="text-gray-700">
                      Pending: <span className="font-bold">{questions.length - validatedCount - rejectedCount}</span>
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                </div>
              )}

              {/* Questions Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Question Display */}
                <div className="lg:col-span-2">
                  <QuestionDisplay
                    question={questions[currentIndex]}
                    index={currentIndex}
                  />
                </div>

                {/* Validation Form */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
                    <ValidationForm
                      onSubmit={handleValidation}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                      canNext={currentIndex < questions.length - 1}
                      canPrevious={currentIndex > 0}
                      currentIndex={currentIndex}
                      totalQuestions={questions.length}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 flex gap-4 flex-wrap">
                <button
                  onClick={handleExport}
                  disabled={isExporting || Object.keys(validations).length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
                >
                  {isExporting ? '⏳ Exporting...' : '💾 Export to Excel'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>📝 JSON Question Validator • No data is stored • Stateless helper tool</p>
        </div>
      </div>
    </div>
  );
}

export default App;
