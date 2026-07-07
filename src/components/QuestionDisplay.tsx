import React from 'react';
import { Question } from '../types/index';

interface QuestionDisplayProps {
  question: Question;
  index: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, index }) => {
  const renderContent = () => {
    const { type, text, content, options, correct, assets } = question;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Question {index + 1} ({type})
          </h3>
          {text && <p className="text-gray-700">{text}</p>}
          {content && <p className="text-gray-700 whitespace-pre-wrap">{content}</p>}
        </div>

        {options && options.length > 0 && (
          <div>
            <p className="font-medium text-gray-800 mb-2">Options:</p>
            <ul className="list-disc list-inside space-y-1">
              {options.map((option, i) => (
                <li key={i} className="text-gray-700">
                  {option}
                </li>
              ))}
            </ul>
          </div>
        )}

        {correct && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="font-medium text-green-900">Correct Answer:</p>
            <p className="text-green-800">
              {Array.isArray(correct) ? correct.join(', ') : correct}
            </p>
          </div>
        )}

        {assets && assets.length > 0 && (
          <div>
            <p className="font-medium text-gray-800 mb-2">Assets:</p>
            <div className="space-y-2">
              {assets.map((asset, i) => (
                <p key={i} className="text-sm text-gray-600 break-all">
                  📎 {asset}
                </p>
              ))}
            </div>
          </div>
        )}

        {question.competence && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-medium text-blue-900">Competencies:</p>
            <p className="text-blue-800">
              {Array.isArray(question.competence)
                ? question.competence.join(', ')
                : question.competence}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {renderContent()}
    </div>
  );
};
