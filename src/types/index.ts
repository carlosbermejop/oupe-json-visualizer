export interface Question {
  id?: string;
  type: string;
  competence: string | string[];
  text?: string;
  content?: string;
  assets?: string[];
  options?: string[];
  correct?: string | string[];
  [key: string]: any;
}

export interface ValidationResult {
  questionId: number;
  jsonFileName: string;
  type: string;
  competence: string;
  validated: boolean;
  reasoning?: string;
  timestamp: string;
}

export interface ExcelRow {
  idTitulo: string;
  idPregunta: number;
  idJson: string;
  IdEstructura: string;
  idTipoPregunta: string;
  idIdioma: string;
  IdCompetencia: string;
  idDificultad: string;
  aprobadaPor: string;
  revisadaEn: string;
  validated: boolean;
  reasoning: string;
}
