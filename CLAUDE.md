# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn dev` — Vite dev server (served under `/oupe-json-visualizer/` due to the configured `base`, matching GitHub Pages routing).
- `yarn build` — `tsc -b && vite build`, output to `dist/`. This is what CI runs.
- `yarn test` — `vitest run`, all unit tests (schema validation, JSON parsing, Excel merge logic). Run a single file with `yarn test src/lib/__tests__/excelMerge.test.ts`.
- `yarn lint` — `oxlint`.
- `yarn preview` — serve the production build locally.

Deployment is automatic via `.github/workflows/deploy.yml` on push to `main` (Node 20, `yarn install --frozen-lockfile`, `yarn build`, deploy `dist/` to GitHub Pages).

## Architecture

Client-side-only React + TypeScript + Vite + Tailwind v4 app. No backend, no persistence — all state lives in `App.tsx`'s `useState` and is discarded on refresh/reset. ExcelJS handles both reading and writing `.xlsx` in the browser.

- **`src/types/exercise.ts`** — discriminated union `Exercise` over the 7 exercise `type`s, mirroring `data/exercise-schema.json`.
- **`src/lib/schema.ts`** — Ajv (+ ajv-formats, for the `uri-reference` format on `assets`) compiled once against `data/exercise-schema.json` (imported directly as JSON — `resolveJsonModule` is on in `tsconfig.app.json`). `validateExercise(data)` is the single validation entry point; don't hand-roll field checks elsewhere.
- **`src/lib/parseExercises.ts`** — turns uploaded `File`s into `ParsedFile[]` (`{filename, exercise, valid, errors}`). A file may contain one exercise object or an array; array entries get a `_N` suffix appended to the filename (`batch.json` → `batch_1.json`, `batch_2.json`) since each entry needs its own merge key downstream.
- **`src/components/FileUpload.tsx`** — generic drag-and-drop/click file picker, used for both the JSON and `.xlsx` inputs.
- **`src/components/QuestionDisplay.tsx`** — type-specific rendering switch (`MCHS` options, `WROD` scrambled_words, `MTCH` match_options, `FIBL` word_bank) driven by the `Exercise` union — this is where new exercise types or fields need a case added.
- **`src/components/ValidationForm.tsx`** — validate/reject controls; reject requires typing reasoning before "Confirm rejection" is enabled.
- **`src/lib/excelMerge.ts`** — the highest-complexity module; see below.
- **`src/App.tsx`** — wires everything together: upload handlers, `Record<filename, ValidationState>` review state, Previous/Next nav with auto-advance on validate/reject, reviewer email input, export/reset.

### Excel merge (`src/lib/excelMerge.ts`)

`mergeIntoWorkbook({workbookBuffer?, reviewed, reviewerEmail, timestamp?})` is a three-way merge, not an overwrite:

1. If a workbook was uploaded, load it with ExcelJS and scan every sheet (except `UNKNOWN`) for a header named `idJson` (the merge key). Rows whose `idJson` matches a reviewed exercise's filename get `validation_status` (`OK` for validated, `KO` for rejected), `Aprobada` (reviewer email), `timestamp`, and `reasoning` written in-place — a `reasoning` column is added to the sheet if it doesn't already exist. All other cells/rows/sheets are left untouched.
2. Reviewed exercises with no matching row anywhere are appended to a new `UNKNOWN` sheet (created if absent), populated from whatever fields the JSON provides.
3. If no workbook was uploaded at all, a fresh single-sheet workbook (`exercise_processing_log`, using the same column set) is built from the reviewed exercises — this is *not* named `UNKNOWN`, since that name only makes sense relative to a prior uploaded workbook.

The real tracking workbook (`data/exercise_processing_log_carga.xlsx`) has columns: `R_PROYECTO, idTitulo, idPregunta, idJson, idEstructura, question_type, idIdioma, IIdCompetencia, Dificultad, validation_status, Aprobada, timestamp` (`idJson`/`idPregunta` are duplicates; `idJson` is the one matched against uploaded filenames). Any change to this module should be re-verified against that real file, not just synthetic fixtures — column layout assumptions (e.g. `idJson` as header name) are load-bearing.

**Known ExcelJS quirk — `fixTableHeaderRowFlags`:** the real workbook's `<table>` XML omits the `headerRowCount` attribute, which per the OOXML spec defaults to `1` (has a header row). ExcelJS's parser doesn't apply that default (`table-xform.js`: `headerRow: attributes.headerRowCount === '1'` evaluates `false` when the attribute is simply absent), so a load→save round-trip re-serializes `headerRowCount="0"` while still emitting the table's full `<autoFilter>`/`<filterColumn>` block — a combination Excel treats as corrupt and silently repairs by deleting the `autoFilter` (surfaced as a "Removed Records: AutoFilter" repair prompt on open). `mergeIntoWorkbook` calls `fixTableHeaderRowFlags` right after loading any uploaded workbook to force `headerRow` back to `true` on every table before writing, since every table this app touches has its header in row 1. Also note: ExcelJS's `.d.ts` for `Worksheet.getTables()` claims it returns `[Table, void][]`, but at runtime it returns `Table[]` directly — see the local `LoadedTable` type in `excelMerge.ts` used to work around the mismatch. If ExcelJS is upgraded, re-check whether this bug still reproduces before assuming the workaround is still needed.

**Gotcha — `ensureColumn` must not rely on `Row.cellCount`:** the real workbook's header row has a formatted-but-valueless spacer cell right after `timestamp` (column M). `Row.cellCount` counts that spacer, so if a new column (e.g. `reasoning`) is appended at `cellCount + 1`, it lands one column too far right (N), leaving M permanently blank on every export — including when recycling a previously-exported file that already has a `reasoning` column. `ensureColumn` instead computes the next column from `Math.max(...headerMap.values()) + 1`, i.e. one past the highest column with an actual header *name*, ignoring valueless trailing cells.

## Domain Model

The core data unit is an **exercise** (English-language teaching exercise), validated against `data/exercise-schema.json` (JSON Schema draft-07, v3.0, "text-gaps as array"). Real-world samples live in `test-data/*.json` (one exercise object per file); minimal one-per-type examples live in `data/{TYPE}.json` and are used as fixtures in `src/lib/__tests__/`.

Every exercise has:
- `type`: one of `FIBL`, `MCHS`, `SHRT`, `WROD`, `WQUE`, `ESSAY`, `MTCH`
- `competence`: array from `GRAMMAR`, `VOCABULARY`, `READING`, `WRITING`, `LISTENING`, `SPEAKING`, `SPELLING`
- `question`: instruction text (often includes mark allocation, e.g. "(10 marks)")
- `text_with_gaps`: array of strings; gaps marked as `[_N_]`. For `ESSAY`, these are task prompts with no gap markers.
- `solutions`: array of correct answers in order; must be empty for `ESSAY`, non-empty otherwise
- `assets`: array of file references (images, audio) used by the exercise
- `_source`: optional provenance metadata (`pdf` filename, `page` number)

Type-specific fields, each conditionally required by the schema's `allOf`:
- `MCHS` requires `options` (choices per gap)
- `WROD` requires `scrambled_words` (one scrambled sentence per gap)
- `MTCH` requires `match_options` (object keyed `A`, `B`, `C`... mapped to sentence endings; solutions reference keys like `"1:D"`)
- `FIBL` optionally has `word_bank`

`data/exercise-schema.json` is the single source of truth for what fields each exercise type carries — `src/types/exercise.ts` and `src/lib/schema.ts` must stay in sync with it.

## Application Behavior

1. **Upload JSON** — one or many exercise files (single object or array), validated against the exercise schema; invalid files/entries are listed with their errors without blocking the valid ones.
2. **Upload Excel (optional)** — an existing tracking workbook. Reviewer's email is entered in a field near the export button (captured at export time, not on upload).
3. **Review** — step through exercises with Previous/Next; type-specific display per the schema above.
4. **Validate/Reject** — each exercise gets a validated/rejected status, with reasoning required on rejection; submitting either auto-advances to the next exercise.
5. **Export to Excel** — see the Excel merge section above; enabled once ≥1 exercise is reviewed and a reviewer email is entered.
6. **Reset** clears all in-memory state (uploaded files, validations, workbook, email); nothing persists between sessions.
