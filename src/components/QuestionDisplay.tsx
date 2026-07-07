import React from 'react';
import { Question } from '../types/index';

interface QuestionDisplayProps {
  question: Question;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question }) => {
  const renderField = (label: string, value: any) => {
    if (!value) return null;
    
    if (Array.isArray(value)) {
      return (
        <div key={label}>
          <p className="font-medium text-gray-800">{label}:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {value.map((item, i) => (
              <li key={i} className="text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div key={label}>
        <p className="font-medium text-gray-800">{label}:</p>
        <p className="text-gray-700 whitespace-pre-wrap ml-2">{String(value)}</p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Question and Competency Header */}
      {(question.question || question.text) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {question.question || question.text}
            {question.competence && (
              <span className="text-base font-normal text-gray-600">
                {' - Competency: '}
                {Array.isArray(question.competence) ? question.competence.join(', ') : question.competence}
              </span>
            )}
          </h3>
        </div>
      )}

      {/* Text with Gaps */}
      {question.text_with_gaps && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="font-medium text-blue-900 mb-2">Text with gaps:</p>
          <p className="text-blue-800 whitespace-pre-wrap">
            {Array.isArray(question.text_with_gaps)
              ? question.text_with_gaps.join('\n')
              : question.text_with_gaps}
          </p>
        </div>
      )}

      {/* Other Relevant Fields */}
      <div className="space-y-4">
        {/* Display fields in this order if they exist */}
        {question.options && renderField('Options', question.options)}
        {question.content && renderField('Content', question.content)}
        {question.text && !question.question && renderField('Text', question.text)}
        {question.assets && question.assets.length > 0 && renderField('Assets', question.assets)}
        
        {/* Display any other fields that aren't special */}
        {Object.entries(question).map(([key, value]) => {
          // Skip fields we've already displayed
          if (['id', 'type', 'competence', 'question', 'text', 'text_with_gaps', 'options', 'content', 'assets', 'correct', 'solutions', '_source'].includes(key)) {
            return null;
          }
          return renderField(key, value);
        })}
      </div>

      {/* Solutions */}
      {question.solutions && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="font-medium text-green-900 mb-2">Solutions:</p>
          <p className="text-green-800 whitespace-pre-wrap">
            {Array.isArray(question.solutions) ? question.solutions.join('\n') : String(question.solutions)}
          </p>
        </div>
      )}

      {/* Correct Answer (if solutions not present) */}
      {!question.solutions && question.correct && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="font-medium text-green-900 mb-2">Correct Answer:</p>
          <p className="text-green-800">
            {Array.isArray(question.correct) ? question.correct.join(', ') : question.correct}
          </p>
        </div>
      )}

      {/* Source */}
      {question._source && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <p className="font-medium text-gray-800 mb-2">Source:</p>
          <p className="text-gray-700">
            {typeof question._source === 'object'
              ? Object.entries(question._source)
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(', ')
              : String(question._source)}
          </p>
        </div>
      )}
    </div>
  );
};
