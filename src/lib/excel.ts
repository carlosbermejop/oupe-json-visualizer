import ExcelJS from 'exceljs';
import { Question, ExcelRow } from '../types/index';

export interface ValidationState {
  [questionIndex: number]: {
    validated: boolean;
    reasoning?: string;
  };
}

const TITLE_ID = '168641285';
const QUESTION_ID_PREFIX = 'IDIOMATIC_1_Q';
const LANGUAGE = 'EN';
const DIFFICULTY = 'F';
const APPROVED_BY = 'Test User';

export const generateExcel = async (
  questions: Question[],
  jsonFileName: string,
  validations: ValidationState
): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Questions');

  // Define columns - keeping exact case from user's model
  const columns = [
    { header: 'idTitulo', key: 'idTitulo', width: 15 },
    { header: 'idPregunta', key: 'idPregunta', width: 15 },
    { header: 'idJson', key: 'idJson', width: 20 },
    { header: 'IdEstructura', key: 'IdEstructura', width: 15 },
    { header: 'idTipoPregunta', key: 'idTipoPregunta', width: 18 },
    { header: 'idIdioma', key: 'idIdioma', width: 12 },
    { header: 'IdCompetencia', key: 'IdCompetencia', width: 20 },
    { header: 'idDificultad', key: 'idDificultad', width: 15 },
    { header: 'aprobadaPor', key: 'aprobadaPor', width: 18 },
    { header: 'revisadaEn', key: 'revisadaEn', width: 25 },
    { header: 'validated', key: 'validated', width: 12 },
    { header: 'reasoning', key: 'reasoning', width: 40 },
  ] as const;

  worksheet.columns = columns as any;

  // Add header row without color styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  // Add data rows
  let questionCounter = 1;
  questions.forEach((question, index) => {
    const validation = validations[index];
    if (validation?.validated) {
      const competenceValue = Array.isArray(question.competence)
        ? question.competence.join(', ')
        : question.competence;

      const row: ExcelRow = {
        idTitulo: TITLE_ID,
        idPregunta: `${QUESTION_ID_PREFIX}_${questionCounter}`,
        idJson: jsonFileName,
        IdEstructura: '',
        idTipoPregunta: question.type,
        idIdioma: LANGUAGE,
        IdCompetencia: competenceValue,
        idDificultad: DIFFICULTY,
        aprobadaPor: APPROVED_BY,
        revisadaEn: new Date().toISOString(),
        validated: true,
        reasoning: '',
      };

      worksheet.addRow(row);
      questionCounter++;
    } else if (validation && !validation.validated) {
      const competenceValue = Array.isArray(question.competence)
        ? question.competence.join(', ')
        : question.competence;

      const row: ExcelRow = {
        idTitulo: TITLE_ID,
        idPregunta: `${QUESTION_ID_PREFIX}_${questionCounter}`,
        idJson: jsonFileName,
        IdEstructura: '',
        idTipoPregunta: question.type,
        idIdioma: LANGUAGE,
        IdCompetencia: competenceValue,
        idDificultad: DIFFICULTY,
        aprobadaPor: APPROVED_BY,
        revisadaEn: new Date().toISOString(),
        validated: false,
        reasoning: validation.reasoning || '',
      };

      worksheet.addRow(row);
      questionCounter++;
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const downloadExcel = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
