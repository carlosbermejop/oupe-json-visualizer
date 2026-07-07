import { Question } from '../types/index';

export const validateQuestions = (data: unknown): { valid: boolean; errors: string[] } => {
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['JSON must be an array of questions'] };
  }

  const errors: string[] = [];

  data.forEach((question, index) => {
    if (typeof question !== 'object' || question === null) {
      errors.push(`Question ${index}: Not an object`);
      return;
    }

    if (!('type' in question) || typeof (question as any).type !== 'string') {
      errors.push(`Question ${index}: Missing or invalid 'type' field`);
    }

    if (!('competence' in question)) {
      errors.push(`Question ${index}: Missing 'competence' field`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const parseJSON = (jsonString: string): { valid: boolean; data?: Question[]; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateQuestions(data);
    
    if (!validation.valid) {
      return {
        valid: false,
        error: `Validation failed: ${validation.errors.join('; ')}`
      };
    }

    return { valid: true, data };
  } catch (err) {
    return {
      valid: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
};
