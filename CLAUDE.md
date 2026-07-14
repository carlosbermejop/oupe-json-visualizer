# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

**No application source code currently exists in this repo.** A prior implementation (React + TypeScript + Vite + Tailwind CSS + ExcelJS, deployed to GitHub Pages) was removed from the working tree; its history is still visible via `git log` (commits `61435ae` through `419a6d0`). What remains on disk is the domain data (exercise schema, sample exercises), a sample tracking workbook, and the deployment workflow — treat this as the spec to rebuild from, not a working app.

When rebuilding, the CI workflow (`.github/workflows/deploy.yml`) already assumes: Node 20, Yarn (`yarn install --frozen-lockfile`), a `yarn build` script producing `./dist`, and deployment to GitHub Pages on push to `main`. A previous `vite.config.ts` set `base: '/oupe-json-visualizer/'` for Pages routing — reinstate that if using Vite again.

## Domain Model

The core data unit is an **exercise** (English-language teaching exercise), validated against `data/exercise-schema.json` (JSON Schema draft-07, v3.0, "text-gaps as array"). Real-world samples live in `test-data/*.json` (one exercise object per file); minimal one-per-type examples live in `data/{TYPE}.json`.

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

Any rebuild of the validator UI or Excel export logic must key its per-type rendering and validation off this schema — it is the single source of truth for what fields each exercise type carries.

## Intended Application Behavior

The tool is a stateless, client-side-only helper (no backend, no persistence beyond the browser session) for reviewing exercise JSON files and recording approval decisions in an Excel workbook:

1. **Upload JSON** — one or many exercise files (single object or array), validated against the exercise schema.
2. **Upload Excel (optional)** — an existing tracking workbook (see `data/exercise_processing_log_carga.xlsx` for the expected shape). Each row is matched to an uploaded JSON by filename, across all tabs. Existing rows/data in the workbook must never be deleted — only added to. The reviewer's email is captured to identify the approver.
3. **Review** — step through exercises with Previous/Next; type-specific display per the schema above.
4. **Validate/Reject** — each exercise gets a validated/rejected status, with reasoning required on rejection.
5. **Export to Excel** — produces a copy of the uploaded workbook (or a fresh one if none was uploaded), adding the approver's email, validation result, and timestamp. Rows present in the uploaded Excel but not matched to any uploaded JSON must still be carried over unchanged. Exercises found in JSON but absent from the uploaded Excel go into a new `UNKNOWN` tab, populated with as much data as the JSON provides.
6. **Reset** clears all state; nothing persists between sessions.

This Excel merge/reconcile behavior (preserve unmatched rows, add an `UNKNOWN` tab for orphan exercises) is the main source of complexity for the export logic — it's a three-way merge (existing workbook ∪ reviewed JSON), not a plain overwrite.
